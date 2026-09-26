/**
 * Xcratch の拡張機能一覧に出す情報を作る。版 (HID 版 / Remap3 版) で共有する。
 *
 * デスクトップ版の scratch-gui/src/lib/libraries/extensions/index.jsx に相当する。
 * 向こうは React 要素 (FormattedMessage) を返すが、Xcratch は読み込み時に
 * setFormatMessage で自分の formatMessage を渡してくるので、こちらは文字列で作る。
 *
 * 版ごとの違い (ID・URL・名前・説明・カードの絵) だけを引数で受け取り、残りは全部ここで決める。
 * 呼ぶのは entry/index.jsx (HID 版) と entry-remap3/index.jsx (Remap3 版)。
 *
 * 画像は scratch-gui/src/lib/libraries/extensions/uiapduino/ のものを直接参照している。
 * rollup の image プラグインが data URI に変換して .mjs に埋め込むので、
 * リポジトリに複製を置く必要はない。
 */

import connectionIconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-illustration.png';
import connectionSmallIconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-small.png';
import {version as packageVersion} from '../../../../../../package.json';

const version = `v${packageVersion}`;

/**
 * 一覧のカードを作る。
 *
 * 訳文の ID は `<extensionId>.entry.name` のように extensionId を頭に付ける。
 * 2 つの版を同時に読み込んだとき、訳文の表が混ざらないようにするため。
 *
 * @param {object} options - 版ごとの値
 * @param {string} options.extensionId - variant*.js の EXTENSION_ID と同じ値
 * @param {string} options.extensionURL - variant*.js の EXTENSION_URL と同じ値
 * @param {string} options.name - 名前の既定の文字列 (英語)
 * @param {string} options.description - 説明の既定の文字列 (英語)
 * @param {object} options.translations - 訳文の表 (translations.json)
 * @param {string} options.iconURL - カードの大きな絵 (600x372)
 * @param {string} options.insetIconURL - カード左下の小さな絵 (80x80)。
 *   ⚠ 後ろの緑の四角は Xcratch の CSS (library-item-inset-image-container の
 *   background-color) で、絵では消せない。絵は幅 2.5rem で、3.5rem の緑の四角の中に置かれる
 * @returns {object} Xcratch が読む entry
 */
const createEntry = ({
    extensionId, extensionURL, name, description, translations, iconURL, insetIconURL
}) => {
    /**
     * 訳文を引く関数。読み込み時に Xcratch のものへ差し替わる。
     * 差し替わるまでは defaultMessage をそのまま返す。
     * @param {object} messageData - format-message へ渡す形
     * @returns {string} 現在の言語の文字列
     */
    let formatMessage = messageData => messageData.defaultMessage;

    return {
        get name () {
            return formatMessage({
                id: `${extensionId}.entry.name`,
                defaultMessage: name,
                description: 'name of the extension'
            });
        },
        extensionId: extensionId,
        // ⚠ 公開したら二度と変えられない。Xcratch はプロジェクトにこの URL を書き込み、
        //   次に開くときここから読み直すため。理由と組み立て方は
        //   scratch-vm/src/extensions/scratch3_uiapduino/index.js の extensionURL を参照。
        //   あちらと必ず同じ値にすること (値は variant*.js にある)。
        extensionURL: extensionURL,
        collaborator: 'tarosay',
        iconURL: iconURL,
        insetIconURL: insetIconURL,
        get description () {
            // ⚠ 対応ブラウザをここに書いてあるのは、間違えたときに何も分からないため。
            //   Firefox には WebHID が無い。それでも拡張は追加できてブロックも並び、
            //   接続だけが失敗する。しかもモーダルは「デバイスが見つかりませんでした」としか
            //   言わない (本当の理由 WebHID is not available は console にしか出ない)。
            //
            //   だから「つなぐには要る」と書く。ブロックが出ているのに繋がらない人が、
            //   自分の話だと気づけるようにするため。ブロックの「UIAPduino につなぐ」と
            //   同じ言葉にしてあるのも同じ理由。
            //
            //   対応していないブラウザを名指ししないのは、数え上げると必ず漏れるから
            //   (Firefox だけでなく Safari にも WebHID は無い)。
            return `${formatMessage({
                id: `${extensionId}.entry.description`,
                defaultMessage: description,
                description: 'description of the extension'
            })} (${version})`;
        },
        tags: ['hardware', 'usb', 'keyboard', 'mouse'],
        featured: true,
        disabled: false,
        // Bluetooth ではなく WebHID を使う。Scratch Link も要らない。
        bluetoothRequired: false,
        internetConnectionRequired: false,
        // 拡張を追加した直後に接続モーダルを開く。
        // キャンセルされても拡張は追加済みのままで、後からステータスボタンで接続できる。
        launchPeripheralConnectionFlow: true,
        // Bluetooth 機器向けの「本体のボタンを押してください」画面を使わず、通常の検索ステップにする。
        useAutoScan: false,
        // 接続モーダルの絵。高さ 165px ちょうどで作ってある
        // (理由はデスクトップ版の index.jsx のコメントを参照)。
        // 接続モーダルの絵は版で分けていない。どちらの版も同じ基板に繋ぐため。
        connectionIconURL: connectionIconURL,
        connectionSmallIconURL: connectionSmallIconURL,
        get connectingMessage () {
            return formatMessage({
                id: `${extensionId}.entry.connectingMessage`,
                defaultMessage: 'Connecting to UIAPduino',
                description: 'message shown while connecting'
            });
        },
        helpLink: 'https://github.com/tarosay/scratch3-uiapduino#readme',
        setFormatMessage: formatter => {
            formatMessage = formatter;
        },
        translationMap: translations
    };
};

export default createEntry;
