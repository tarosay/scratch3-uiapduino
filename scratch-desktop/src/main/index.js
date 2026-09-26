import {BrowserWindow, Menu, app, dialog, ipcMain, screen, shell, systemPreferences} from 'electron';
import fs from 'fs-extra';
import path from 'path';
import {URL} from 'url';
import {promisify} from 'util';

import argv from './argv';
import {getFilterForExtension} from './FileFilters';
import telemetry from './ScratchDesktopTelemetry';
import MacOSMenu from './MacOSMenu';
import log from '../common/log.js';
import {version} from '../../package.json';

/**
 * このビルドの表示名。
 *
 * 上流の package.json は productName が "Scratch" で、公式 Scratch Desktop と同じ。
 * そのまま使うとウィンドウタイトルもユーザデータの保存先も公式と区別がつかない。
 * build-scratch3-uiapduino.ps1 が electron-builder.yaml の productName / appId も
 * 同じ名前に差し替えるので、インストール先とスタートメニューも分かれる。
 * @type {string}
 */
const APP_NAME = 'Scratch UIAPduino';

// ユーザデータの保存先を公式と分ける。
// app.getPath('userData') より前に呼ぶ必要がある。
app.setName(APP_NAME);

// suppress deprecation warning; this will be the default in Electron 9
app.allowRendererProcessReuse = true;

telemetry.appWasOpened();

// const defaultSize = {width: 1096, height: 715}; // minimum
const defaultSize = {width: 1280, height: 800}; // good for MAS screenshots

const isDevelopment = process.env.NODE_ENV !== 'production';

const devToolKey = ((process.platform === 'darwin') ?
    { // macOS: command+option+i
        alt: true, // option
        control: false,
        meta: true, // command
        shift: false,
        code: 'KeyI'
    } : { // Windows: control+shift+i
        alt: false,
        control: true,
        meta: false, // Windows key
        shift: true,
        code: 'KeyI'
    }
);

// global window references prevent them from being garbage-collected
const _windows = {};

// enable connecting to Scratch Link even if we DNS / Internet access is not available
// this must happen BEFORE the app ready event!
app.commandLine.appendSwitch('host-resolver-rules', 'MAP device-manager.scratch.mit.edu 127.0.0.1');

const displayPermissionDeniedWarning = (browserWindow, permissionType) => {
    let title;
    let message;
    switch (permissionType) {
    case 'camera':
        title = 'Camera Permission Denied';
        message = 'Permission to use the camera has been denied. ' +
            'Scratch will not be able to take a photo or use video sensing blocks.';
        break;
    case 'microphone':
        title = 'Microphone Permission Denied';
        message = 'Permission to use the microphone has been denied. ' +
            'Scratch will not be able to record sounds or detect loudness.';
        break;
    default: // shouldn't ever happen...
        title = 'Permission Denied';
        message = 'A permission has been denied.';
    }

    let instructions;
    switch (process.platform) {
    case 'darwin':
        instructions = 'To change Scratch permissions, please check "Security & Privacy" in System Preferences.';
        break;
    default:
        instructions = 'To change Scratch permissions, please check your system settings and restart Scratch.';
        break;
    }
    message = `${message}\n\n${instructions}`;

    dialog.showMessageBox(browserWindow, {type: 'warning', title, message});
};

/**
 * Build an absolute URL from a relative one, optionally adding search query parameters.
 * The base of the URL will depend on whether or not the application is running in development mode.
 * @param {string} url - the relative URL, like 'index.html'
 * @param {*} search - the optional "search" parameters (the part of the URL after '?'), like "route=about"
 * @returns {string} - an absolute URL as a string
 */
const makeFullUrl = (url, search = null) => {
    const baseUrl = (isDevelopment ?
        `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/` :
        `file://${__dirname}/`
    );
    const fullUrl = new URL(url, baseUrl);
    if (search) {
        fullUrl.search = search; // automatically percent-encodes anything that needs it
    }
    return fullUrl.toString();
};

/**
 * Prompt in a platform-specific way for permission to access the microphone or camera, if Electron supports doing so.
 * Any application-level checks, such as whether or not a particular frame or document should be allowed to ask,
 * should be done before calling this function.
 * This function may return a Promise!
 *
 * @param {string} mediaType - one of Electron's media types, like 'microphone' or 'camera'
 * @returns {boolean|Promise.<boolean>} - true if permission granted, false otherwise.
 */
const askForMediaAccess = mediaType => {
    if (systemPreferences.askForMediaAccess) {
        // Electron currently only implements this on macOS
        // This returns a Promise
        return systemPreferences.askForMediaAccess(mediaType);
    }
    // For other platforms we can't reasonably do anything other than assume we have access.
    return true;
};

// UIAPduino (HID ProMicro CH32V003) の WebHID フィルタ。
// UIAPduino 側のディスクリプタと一致していること。
const UIAPDUINO_VENDOR_ID = 0x1209;
const UIAPDUINO_PRODUCT_ID = 0xD004;

// 書き込みモードの基板 (rv003usb ブートローダ)。通常のスケッチとは別のデバイスで、
// 書き込みモードに入ると D004 が消えてこちらが現れる。
//
// ⚠ これを許可しないと「スケッチを書き込む」ブロックが動かない。
//   ブロックはデスクトップ版にも並ぶ (拡張本体は Xcratch 版と同じ 1 ファイル) ので、
//   許可が無いと押しても「書き込みモードになっていません」で止まる。
const UIAPDUINO_BOOTLOADER_PRODUCT_ID = 0xB803;

const isUiapduino = device => (
    device.vendorId === UIAPDUINO_VENDOR_ID && (
        device.productId === UIAPDUINO_PRODUCT_ID ||
        device.productId === UIAPDUINO_BOOTLOADER_PRODUCT_ID
    )
);

/**
 * WebHID の設定を済ませた session を記録する。
 *
 * createWindow は main / about / privacy の 3 つで呼ばれ、いずれも既定 session を共有する。
 * setXxxHandler は上書きなので何度呼んでも無害だが、'select-hid-device' は on() なので
 * リスナが積み上がり、1 回のイベントで callback が 3 回呼ばれて
 * "One-time callback was called more than once" で main プロセスが落ちる。
 */
const webHidConfiguredSessions = new WeakSet();

/**
 * session に WebHID (UIAPduino) の許可設定を入れる。同じ session には一度だけ。
 *
 * これらを設定しないと、Electron は既定で HID デバイスをレンダラに一切見せない。
 *
 * @param {Session} session - 対象の session
 * @returns {void}
 */
const setupWebHid = session => {
    if (webHidConfiguredSessions.has(session)) return;
    webHidConfiguredSessions.add(session);

    // getDevices() や open() の際に呼ばれる。UIAPduino だけを許可する。
    // これが true を返すことで、requestDevice() を一度も呼んでいないデバイスも
    // getDevices() で見えるようになる (= ユーザ操作なしで接続できる)。
    session.setDevicePermissionHandler(details => (
        details.deviceType === 'hid' && isUiapduino(details.device)
    ));

    // requestDevice() 実行時にデバイス選択ダイアログの代わりに呼ばれる。
    // Electron はネイティブのピッカーを出さないため、ここで選ばないと必ず空で返る。
    // UIAPduino が1台だけ繋がっている前提で自動選択する。
    session.on('select-hid-device', (event, details, callback) => {
        event.preventDefault();
        const device = details.deviceList.find(isUiapduino);
        if (device) {
            callback(device.deviceId);
        } else {
            // 引数なしで呼ぶとリクエストのキャンセルになる (Electron のドキュメントどおり)
            callback();
        }
    });
};

// --- 閉じるときの確認を画面の言語で出す -------------------------------------
//
// 上流は「Leave Scratch?」「Stay / Leave」を英語で直書きしていた。子供が使うので、
// 画面で選んでいる言語で出す。
//
// main プロセスは画面の言語を知らないので、scratch-gui の reducers/locales.js が
// 言語が決まったとき・変わったときに 'uiapduino-locale' で知らせてくる。
// それを覚えておき、確認を出すときに引く。
//
// 訳文を持っているのは日本語 (漢字) と にほんご (ひらがな) だけ。
// それ以外の言語は上流と同じ英語で出す。

/**
 * 画面で選んでいる言語。scratch-gui の locale の値 ('en' / 'ja' / 'ja-Hira' など)。
 * 起動時の既定は scratch-gui と同じ 'en'。
 * @type {string}
 */
let guiLocale = 'en';

/**
 * 閉じるときの確認の文言。キーは scratch-gui の locale。
 * @type {Object<string, {message: string, detail: string, stay: string, leave: string}>}
 */
const LEAVE_DIALOG_TEXT = {
    'en': {
        message: 'Leave Scratch?',
        detail: 'Any unsaved changes will be lost.',
        stay: 'Stay',
        leave: 'Leave'
    },
    'ja': {
        message: 'Scratch を閉じますか？',
        detail: '保存していない変更は消えてしまいます。',
        stay: '戻る',
        leave: '閉じる'
    },
    'ja-Hira': {
        message: 'Scratch を とじますか？',
        detail: 'ほぞんしていない へんこうは きえてしまいます。',
        stay: 'もどる',
        leave: 'とじる'
    }
};

/**
 * 今の画面の言語で、閉じるときの確認の文言を返す。訳文が無い言語は英語。
 * @returns {{message: string, detail: string, stay: string, leave: string}} 文言
 */
const leaveDialogText = () => LEAVE_DIALOG_TEXT[guiLocale] || LEAVE_DIALOG_TEXT.en;

// --- UIAPduino が抜かれたときの後始末 ---------------------------------------
//
// UIAPduino は HID マウスそのものなので、ボタンを押したままの状態で USB を抜かれると、
// mousedown を受け取ったウィンドウが「離された」を受け取れないまま取り残される。
//
// **デバイス側にはもう何もできない。** 基板はバスから電源を取っているので、
// 抜かれた時点で止まる。5 秒の見張りも動けない。
// Scratch も居なくなったデバイスにはコマンドを送れない。後始末はホスト側の仕事になる。
//
// 実機で切り分けた結果は次のとおり。**直せるのは自分のウィンドウの中だけ。**
//
//   OS 全体のボタン状態
//     → **down のまま残る。** 抜いた後、別アプリでの 1 回目のクリックが
//        消費されることで確認した (既に down なので押しても変化が無く、
//        離したときの up だけが出る)。
//        これを解除できるのは OS への入力注入だけで、採用しなかった (下記)。
//
//   mousedown を受け取った「他アプリ」(メモ帳など)
//     → ドラッグ中のまま取り残される。**自動では直せない。**
//        利用者がどこかを 1 回クリックすれば消える。
//
//   Scratch 自身 (Scratch の上で押した場合)
//     → Chromium が掴んだまま。**自分のウィンドウなので mouseUp を送れば直る。**
//        これがこの関数の役目。
//
// ⛔ 試して捨てた案が 3 つある。同じ道を辿らないように残しておく。
//
//   1. PowerShell から user32 の keybd_event / mouse_event を P/Invoke
//      → Avast が IDP.HELU.PSE85 (コマンドライン検出) でブロックする。
//        難読化されたコマンド + C# の動的コンパイル + 入力の注入という
//        マルウェアの典型パターンそのもので、検出される方が正しい。
//
//   2. フォアグラウンドを奪ってほかのアプリのマウスキャプチャを打ち切る
//      → 効かなかった (実機で確認)。BrowserWindow.focus() も、
//        1x1 の新規ウィンドウを一瞬出す手も、どちらも他アプリのドラッグを
//        解除できなかった。Windows の SetForegroundWindow には制限があり、
//        入力を受け取っていないプロセスはフォアグラウンドを奪えない。
//        そもそも OS 側が down のままなので、仮に奪えても根治しない。
//
//   3. koffi (N-API の FFI) でプロセス内から user32 を呼ぶ
//      → 技術的には成立する (Electron 15 / ia32 では koffi 2.8.0 が動くと確認済み)。
//        採用しなかったのは、FFI の宣言を誤ると例外で拾えずプロセスごと落ちること、
//        15 プラットフォーム分 68MB のネイティブ依存を固定バージョンで抱えることが、
//        「クリック 1 回の手間が減る」という利益に見合わないため。
//
// したがって「ケーブルを抜く」の保証はこうなる。
//   デバイスは必ず止まる / Scratch 自身は自動で直る /
//   操作していた他アプリのドラッグだけ残り、どこかを 1 回クリックすれば消える。

/**
 * 押しっぱなしのまま UIAPduino が抜かれたときの、自分のウィンドウの後始末。
 *
 * 直せるのは Scratch 自身が掴んだままの場合だけ。
 * ほかのアプリのドラッグと OS 全体のボタン状態には手が届かない (上のコメント参照)。
 *
 * @returns {void}
 */
const releaseHeldInput = () => {
    const window = _windows.main;
    if (!window || window.isDestroyed()) return;

    try {
        // 座標をカーソル位置に合わせるのは、掴んだままの要素に届かせるため。
        // 押されていないボタンに mouseUp を送っても害はない。
        const bounds = window.getContentBounds();
        const cursor = screen.getCursorScreenPoint();
        const x = Math.max(0, Math.min(bounds.width - 1, cursor.x - bounds.x));
        const y = Math.max(0, Math.min(bounds.height - 1, cursor.y - bounds.y));

        for (const button of ['left', 'right', 'middle']) {
            window.webContents.sendInputEvent({type: 'mouseUp', x, y, button, clickCount: 1});
        }
        // NOTE: キーボードのブロックを足したら、ここで修飾キーの keyUp も送ること。
    } catch (e) {
        log.error(`Failed to release held input: ${e}`);
    }
};

const handlePermissionRequest = async (webContents, permission, callback, details) => {
    if (webContents !== _windows.main.webContents) {
        // deny: request came from somewhere other than the main window's web contents
        return callback(false);
    }
    if (!details.isMainFrame) {
        // deny: request came from a subframe of the main window, not the main frame
        return callback(false);
    }
    if (permission === 'hid') {
        // allow: WebHID for the UIAPduino extension.
        //
        // NOTE: Electron 15 では 'hid' は setPermissionRequestHandler の許可種別に含まれず、
        //       setPermissionCheckHandler 側の種別なので、この分岐は通常呼ばれない。
        //       実際の許可は下の handlePermissionCheck が行う。
        //       将来 Electron 側の扱いが変わった場合に備えて残してある。
        return callback(true);
    }
    if (permission !== 'media') {
        // deny: request is for some other kind of access like notifications or pointerLock
        return callback(false);
    }
    const requiredBase = makeFullUrl('');
    if (details.requestingUrl.indexOf(requiredBase) !== 0) {
        // deny: request came from a URL outside of our "sandbox"
        return callback(false);
    }
    let askForMicrophone = false;
    let askForCamera = false;
    for (const mediaType of details.mediaTypes) {
        switch (mediaType) {
        case 'audio':
            askForMicrophone = true;
            break;
        case 'video':
            askForCamera = true;
            break;
        default:
            // deny: unhandled media type
            return callback(false);
        }
    }
    const parentWindow = _windows.main; // if we ever allow media in non-main windows we'll also need to change this
    if (askForMicrophone) {
        const microphoneResult = await askForMediaAccess('microphone');
        if (!microphoneResult) {
            displayPermissionDeniedWarning(parentWindow, 'microphone');
            return callback(false);
        }
    }
    if (askForCamera) {
        const cameraResult = await askForMediaAccess('camera');
        if (!cameraResult) {
            displayPermissionDeniedWarning(parentWindow, 'camera');
            return callback(false);
        }
    }
    return callback(true);
};

/**
 * パーミッションの「チェック」に応答する。
 *
 * Electron 15 では navigator.hid へのアクセス可否はこちら ('hid') で決まる。
 * setPermissionRequestHandler の許可種別に 'hid' は無い。
 *
 * WARNING: このハンドラを設定すると、すべてのパーミッションチェックの既定動作を奪う。
 *          Electron はハンドラ未設定のとき CheckPermissionWithDetails で true を返すので、
 *          'hid' 以外は true を返して既定に合わせないと既存機能を壊す。
 *
 * @param {WebContents|null} webContents - チェック元。クロスオリジンの子フレームでは null
 * @param {string} permission - 'hid' など
 * @param {string} requestingOrigin - チェック元のオリジン
 * @param {object} details - isMainFrame などが入る
 * @returns {boolean} 許可するなら true
 */
const handlePermissionCheck = (webContents, permission, requestingOrigin, details) => {
    if (permission !== 'hid') {
        // ハンドラ未設定時の Electron の既定に合わせる
        return true;
    }
    if (!_windows.main || webContents !== _windows.main.webContents) {
        // deny: 本体ウィンドウ以外からの WebHID
        return false;
    }
    if (!details || !details.isMainFrame) {
        // deny: 子フレームからの WebHID
        return false;
    }
    // allow: 実際にどのデバイスを渡すかは setDevicePermissionHandler が VID/PID で絞る
    return true;
};

const createWindow = ({search = null, url = 'index.html', ...browserWindowOptions}) => {
    const window = new BrowserWindow({
        useContentSize: true,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        },
        ...browserWindowOptions
    });
    const webContents = window.webContents;

    webContents.session.setPermissionRequestHandler(handlePermissionRequest);
    webContents.session.setPermissionCheckHandler(handlePermissionCheck);

    // --- WebHID (UIAPduino) ---------------------------------------------
    // navigator.hid.getDevices() / requestDevice() が UIAPduino を返せるようにする。
    // 3 つのウィンドウが同じ session を共有するので、設定は一度だけ行う。
    setupWebHid(webContents.session);

    webContents.on('before-input-event', (event, input) => {
        if (input.code === devToolKey.code &&
            input.alt === devToolKey.alt &&
            input.control === devToolKey.control &&
            input.meta === devToolKey.meta &&
            input.shift === devToolKey.shift &&
            input.type === 'keyDown' &&
            !input.isAutoRepeat &&
            !input.isComposing) {
            event.preventDefault();
            webContents.openDevTools({mode: 'detach', activate: true});
        }
    });

    webContents.on('new-window', (event, newWindowUrl) => {
        shell.openExternal(newWindowUrl);
        event.preventDefault();
    });

    const fullUrl = makeFullUrl(url, search);
    window.loadURL(fullUrl);
    window.once('ready-to-show', () => {
        webContents.send('ready-to-show');
    });

    return window;
};

const createAboutWindow = () => {
    const window = createWindow({
        width: 400,
        height: 400,
        parent: _windows.main,
        search: 'route=about',
        title: `About ${APP_NAME}`
    });
    return window;
};

const createPrivacyWindow = () => {
    const window = createWindow({
        width: _windows.main.width * 0.8,
        height: _windows.main.height * 0.8,
        parent: _windows.main,
        search: 'route=privacy',
        title: `${APP_NAME} Privacy Policy`
    });
    return window;
};

const getIsProjectSave = downloadItem => {
    switch (downloadItem.getMimeType()) {
    case 'application/x.scratch.sb3':
        return true;
    }
    return false;
};

const createMainWindow = () => {
    const window = createWindow({
        width: defaultSize.width,
        height: defaultSize.height,
        title: `${APP_NAME} ${version}` // something like "Scratch 3.14"
    });
    const webContents = window.webContents;

    webContents.session.on('will-download', (willDownloadEvent, downloadItem) => {
        const isProjectSave = getIsProjectSave(downloadItem);
        const itemPath = downloadItem.getFilename();
        const baseName = path.basename(itemPath);
        const extName = path.extname(baseName);
        const options = {
            defaultPath: baseName
        };
        if (extName) {
            const extNameNoDot = extName.replace(/^\./, '');
            options.filters = [getFilterForExtension(extNameNoDot)];
        }
        const userChosenPath = dialog.showSaveDialogSync(window, options);
        // this will be falsy if the user canceled the save
        if (userChosenPath) {
            const userBaseName = path.basename(userChosenPath);
            const tempPath = path.join(app.getPath('temp'), userBaseName);

            // WARNING: `setSavePath` on this item is only valid during the `will-download` event. Calling the async
            // version of `showSaveDialog` means the event will finish before we get here, so `setSavePath` will be
            // ignored. For that reason we need to call `showSaveDialogSync` above.
            downloadItem.setSavePath(tempPath);

            downloadItem.on('done', async (doneEvent, doneState) => {
                try {
                    if (doneState !== 'completed') {
                        // The download was canceled or interrupted. Cancel the telemetry event and delete the file.
                        throw new Error(`save ${doneState}`); // "save cancelled" or "save interrupted"
                    }
                    await fs.move(tempPath, userChosenPath, {overwrite: true});
                    if (isProjectSave) {
                        const newProjectTitle = path.basename(userChosenPath, extName);
                        webContents.send('setTitleFromSave', {title: newProjectTitle});

                        // "setTitleFromSave" will set the project title but GUI has already reported the telemetry
                        // event using the old title. This call lets the telemetry client know that the save was
                        // actually completed and the event should be committed to the event queue with this new title.
                        telemetry.projectSaveCompleted(newProjectTitle);
                    }
                } catch (e) {
                    if (isProjectSave) {
                        telemetry.projectSaveCanceled();
                    }
                    // don't clean up until after the message box to allow troubleshooting / recovery
                    await dialog.showMessageBox(window, {
                        type: 'error',
                        title: 'Failed to save project',
                        message: `Save failed:\n${userChosenPath}`,
                        detail: e.message
                    });
                    fs.exists(tempPath).then(exists => {
                        if (exists) {
                            fs.unlink(tempPath);
                        }
                    });
                }
            });
        } else {
            downloadItem.cancel();
            if (isProjectSave) {
                telemetry.projectSaveCanceled();
            }
        }
    });

    webContents.on('will-prevent-unload', ev => {
        // 上流は英語の直書きだった。画面で選んでいる言語で出す (leaveDialogText を参照)。
        const text = leaveDialogText();
        const choice = dialog.showMessageBoxSync(window, {
            title: APP_NAME,
            type: 'question',
            message: text.message,
            detail: text.detail,
            buttons: [text.stay, text.leave],
            cancelId: 0, // closing the dialog means "stay"
            defaultId: 0 // pressing enter or space without explicitly selecting something means "stay"
        });
        const shouldQuit = (choice === 1);
        if (shouldQuit) {
            ev.preventDefault();
        }
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
};

if (process.platform === 'darwin') {
    const osxMenu = Menu.buildFromTemplate(MacOSMenu(app));
    Menu.setApplicationMenu(osxMenu);
} else {
    // disable menu for other platforms
    Menu.setApplicationMenu(null);
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
    app.quit();
});

app.on('will-quit', () => {
    telemetry.appWillClose();
});

// work around https://github.com/MarshallOfSound/electron-devtools-installer/issues/122
// which seems to be a result of https://github.com/electron/electron/issues/19468
if (process.platform === 'win32') {
    const appUserDataPath = app.getPath('userData');
    const devToolsExtensionsPath = path.join(appUserDataPath, 'DevTools Extensions');
    try {
        fs.unlinkSync(devToolsExtensionsPath);
    } catch (_) {
        // don't complain if the file doesn't exist
    }
}

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    if (isDevelopment) {
        import('electron-devtools-installer').then(importedModule => {
            const {default: installExtension, ...devToolsExtensions} = importedModule;
            const extensionsToInstall = [
                devToolsExtensions.REACT_DEVELOPER_TOOLS,
                devToolsExtensions.REACT_PERF,
                devToolsExtensions.REDUX_DEVTOOLS
            ];
            for (const extension of extensionsToInstall) {
                // WARNING: depending on a lot of things including the version of Electron `installExtension` might
                // return a promise that never resolves, especially if the extension is already installed.
                installExtension(extension).then(
                    extensionName => log(`Installed dev extension: ${extensionName}`),
                    errorMessage => log.error(`Error installing dev extension: ${errorMessage}`)
                );
            }
        });
    }

    _windows.main = createMainWindow();
    _windows.main.on('closed', () => {
        delete _windows.main;
    });
    _windows.about = createAboutWindow();
    _windows.about.on('close', event => {
        event.preventDefault();
        _windows.about.hide();
    });
    _windows.privacy = createPrivacyWindow();
    _windows.privacy.on('close', event => {
        event.preventDefault();
        _windows.privacy.hide();
    });
});

// UIAPduino が抜かれたとき、押しっぱなしの心当たりがあればレンダラから呼ばれる。
ipcMain.on('uiapduino-release-held-input', () => {
    releaseHeldInput();
});

// 画面の言語が決まったとき・変わったときに scratch-gui の reducers/locales.js から呼ばれる。
// 閉じるときの確認をその言語で出すために覚えておく (leaveDialogText を参照)。
ipcMain.on('uiapduino-locale', (event, locale) => {
    if (typeof locale === 'string') guiLocale = locale;
});

ipcMain.on('open-about-window', () => {
    _windows.about.show();
});

ipcMain.on('open-privacy-policy-window', () => {
    _windows.privacy.show();
});

// start loading initial project data before the GUI needs it so the load seems faster
const initialProjectDataPromise = (async () => {
    if (argv._.length === 0) {
        // no command line argument means no initial project data
        return;
    }
    if (argv._.length > 1) {
        log.warn(`Expected 1 command line argument but received ${argv._.length}.`);
    }
    const projectPath = argv._[argv._.length - 1];
    try {
        const projectData = await promisify(fs.readFile)(projectPath, null);
        return projectData;
    } catch (e) {
        dialog.showMessageBox(_windows.main, {
            type: 'error',
            title: 'Failed to load project',
            message: `Could not load project from file:\n${projectPath}`,
            detail: e.message
        });
    }
    // load failed: initial project data undefined
})(); // IIFE

ipcMain.handle('get-initial-project-data', () => initialProjectDataPromise);
