// scratch3-uiapduino / uiapduinoProcessor.js
// Created by tarosay (2026)
//
// UIAPduino との USB-HID (WebHID) 通信層。
//
// 「1コマンド送って応答を待ってから次を送る」というキュー方式は
// scratch3-tello の telloProcessor.js と同じ。違いは transport が
// dgram (UDP) ではなく WebHID である点だけ。
//
// ブロック定義 (index.js) はこのファイルの実装を一切知らない。
// index.js が使うのは connect() / isConnected() / request() / resetQueue() の 4 つだけで、
// プロトコルを変更する場合もこのファイルだけを直せばよい。
//
// ── プロトコルの出典 ────────────────────────────────────────────────────────
// ワイヤフォーマットは uiap-hid-web (https://tarosay.github.io/uiap-hid-web/) の
// uiapruby.html が実機に対して使っているものに合わせてある。
// デバイス側ライブラリ (Hid.h) が既に持っている契約なので、
// 既存スケッチ資産と同じ経路で動く。
//
// ── 版について ──────────────────────────────────────────────────────────────
// このファイルは HID 版と Remap3 版で共有している。版ごとに違う値はここに書かず、
// 相手にするスケッチの版の番号だけを、作るときに引数で受け取る (constructor)。
// 1 つのアプリ (デスクトップ版) に両方の版が同時に入るので、
// ファイルの中で版を決め打ちにはできない。

/**
 * WebHID デバイスフィルタ。
 * HID ProMicro CH32V003 (Board Version V1.4)
 */
const DEVICE_FILTER = {
    vendorId: 0x1209,
    productId: 0xD004,
    usagePage: 0xFF00,
    usage: 0x01
};

/**
 * Feature Report (Web → UIAPduino) のサイズ。
 * arduino_core_ch32 v1.1.5 以降は 32 バイト。
 * それ以前は 16 バイトなので、実際のサイズは接続時にディスクリプタから取得する。
 */
const FEATURE_REPORT_SIZE = 32;

/**
 * Input Report (UIAPduino → Web) のサイズ。
 * Low-Speed USB の EP3 IN は 8 バイト固定。
 */
const INPUT_REPORT_SIZE = 8;

/** sendFeatureReport / inputreport で使うレポート ID。番号なしレポートなら 0。 */
const REPORT_ID = 0;

/**
 * 期待するプロトコルのバージョン。
 *
 * 接続時に PING を投げ、デバイスが返す値がこれと一致しなければ接続を拒否する。
 * スケッチは基板に焼かれたまま残るので、Scratch だけ更新される状況が起きる。
 * 照合が無いと、噛み合わないコマンドを送って
 * 「ブロックが無言で何もしない」という一番わかりにくい壊れ方をする。
 *
 * sketches/ScratchUiapduino の PROTOCOL_VERSION と同じ値でなければならない。
 *
 * ⚠ 上げる条件は「プロトコルを変えたとき」ではなく「今の番号が公開済みのとき」。
 *   まだ配っていない番号には、守るべき基板が存在しない。
 *   未公開なら番号は据え置き、中身だけ作り直して焼き直す。
 *   詳しい理由はスケッチ側の同じ定数のコメントにある。
 *
 *   1 : ピン操作のみ
 *   2 : キーボード / マウス / 非常停止を追加。USB 設定が Keyboard+Mouse+WebHID になった
 *   3 : ダブルクリックとドラッグを追加
 *   4 : KEY_TEXT / KEY_WRITE が押しっぱなしの修飾キーを壊さなくなった
 *       (「[Ctrl] を押しながら〔 〕」の囲みブロックのため)
 *   5 : 大文字と記号が打てるようになった。押しっぱなしの Shift は
 *       大文字小文字を反転させる (バージョン 4 は大文字が黙って消えていた)
 *   6 : サーボと距離計を追加。ANALOG_WRITE と SERVO が周波数を伴うようになった
 *       ([3..4] に Hz。それまで ANALOG_WRITE は [1]=pin [2]=duty の 3 バイトだった)
 *   7 : シリアル通信を追加。SERIAL_BEGIN / WRITE / READ と受信通知 (0x54)。
 *       begin 後は D15 / D16 (= A5 / A6) が TX / RX になるので弾くようになった
 *       (6 は v0.2.1 として公開済みなので据え置けない)
 *   8 : NeoPixel を追加。NEO_BEGIN / SET / FILL / SHOW / BRIGHTNESS (0x60-0x64)。
 *       begin 後は D8 (SPI1 MOSI) を弾くようになった
 *       (7 は v0.2.2 として公開済みなので据え置けない)
 * @type {number}
 */
const PROTOCOL_VERSION = 8;

/*
 * この拡張機能が相手にするスケッチの版 (SKETCH_VARIANT) は variant*.js が持ち、
 * index.js が UiapduinoProcessor を作るときに渡す。
 *
 * UIAPduino は Flash が 16KB しかなく、機能を全部は載せられない。
 * 派生が出る前提で、基板がどの版を焼かれているかを PING の応答の上位バイトで名乗る。
 *
 * これが無いと、別の版が焼かれた基板に繋いだとき
 * 「プロトコルのバージョンが違います」としか言えない。本当の原因は
 * 版違いなのに、利用者は同じスケッチを書き込み直してまた失敗する。
 */

/**
 * 版の番号と名前。エラーの文面に出す。
 *
 * 自分の版だけでなく全部の版を並べておく。基板に別の版が焼かれていたとき、
 * それが何なのかを名前で言えるようにするため。
 *
 * ⚠ 0 は「版を名乗らない世代のスケッチ」と同じ値になる。
 *   あちらは PROTOCOL_VERSION だけを 1 バイトで返すので上位バイトが 0 になり、
 *   結果として HID 版として扱われる。既に配った基板を弾かないための約束なので、
 *   0 の意味は変えないこと。新しい版は 1 から順に振る。
 * @type {object}
 */
const VARIANT = {
    0: 'HID 版 (キーボード / マウス / ピン操作)',
    1: 'Remap3 版 (HID 版の機能に加えて PWM を 8 本)'
};

/** ハンドシェイクの結果を表す特別な値 */
const HANDSHAKE = {
    /** PING に応答が無かった (スケッチ未書き込み / 別のスケッチ) */
    NO_RESPONSE: -1,
    /** バージョンを返さない世代のスケッチ (PING に RSP_OK だけを返す) */
    LEGACY: 0
};

/**
 * connect() が失敗したときの理由コード。
 *
 * 上位 (index.js) はこれを見てログを出す。
 * 現行の Scratch GUI 3.29 は検索中のエラー種別を区別できないので、
 * GUI への通知はどの理由でも PERIPHERAL_SCAN_TIMEOUT に寄せる。
 * 理由ごとの案内をモーダルに出したくなったらここを起点に分岐する。
 */
const REASON = {
    /** navigator.hid が無い (WebHID 非対応の実行環境) */
    NO_API: 'no-api',
    /**
     * 対象デバイスが無い、またはデバイス選択がキャンセルされた。
     *
     * WebHID はどちらの場合も空配列を返し、Electron の select-hid-device も
     * 候補が無ければ callback() でキャンセル扱いにするため、この 2 つは区別できない。
     */
    NOT_FOUND_OR_CANCELLED: 'not-found-or-cancelled',
    /** HIDDevice.open() に失敗した */
    OPEN_FAILED: 'open-failed',
    /** PING に応答が無かった */
    HANDSHAKE_NO_RESPONSE: 'handshake-no-response',
    /** プロトコルのバージョンが一致しない (旧世代スケッチを含む) */
    PROTOCOL_MISMATCH: 'protocol-mismatch',
    /**
     * 別の版のスケッチが焼かれている。
     *
     * バージョン不一致とは分けてある。書き込み直せば解決するあちらと違い、
     * こちらは「その版に対応した別の拡張機能を使う」が正解のこともあるため。
     */
    VARIANT_MISMATCH: 'variant-mismatch',
    /** 上記以外の予期しない失敗 */
    UNKNOWN: 'unknown'
};

/**
 * コマンド ID (Web → UIAPduino, Feature Report の先頭バイト)。
 *
 * 0x01 は Hid.h の「接続通知」で予約済み。
 * 0x01〜0x11 は uiapruby の SD ファイル操作と RUN/STOP が使っているため、
 * Scratch 拡張は衝突しない 0x20〜 を使う。
 * こうしておけば将来 1 つのスケッチに UIAPruby VM と Scratch 対応を同居させられる。
 */
const CMD = {
    /** 接続通知。デバイス側 WaitAvailable() を解除する。応答は返らない。 */
    CONNECT_NOTIFY: 0x01,
    /** 疎通確認。デバイスは RSP_OK を返すだけ。 */
    PING: 0x20,
    /** ピンのモード設定。 [1]=pin [2]=mode */
    PIN_MODE: 0x21,
    /** デジタル出力。 [1]=pin [2]=value(0/1) */
    DIGITAL_WRITE: 0x22,
    /** デジタル入力。RSP_DATA で 0/1 が返る。 [1]=pin */
    DIGITAL_READ: 0x23,
    /** アナログ出力 (PWM)。 [1]=pin [2]=duty(0-255) [3..4]=周波数 Hz (uint16LE) */
    ANALOG_WRITE: 0x24,
    /** アナログ入力。RSP_DATA で読み取り値が返る。 [1]=pin */
    ANALOG_READ: 0x25,
    /**
     * サーボ。 [1]=pin [2]=duty(0-255) [3..4]=周波数 Hz (uint16LE)
     *
     * ⚠ 中身は ANALOG_WRITE と全く同じ。デバイス側は同じ case で処理する。
     *   ID を分けてあるのは hid-console.html でログを追うときに、
     *   どちらのブロックが出したものか生バイトで区別できるようにするため。
     *
     * ⚠ 角度を送るのではない。デバイスは「サーボ」を知らない。
     *   角度 → パルス幅 → duty の変換は index.js が持っている。
     *   こうしておくと、サーボを変えても可動域を変えても基板を焼き直さずに済む。
     *
     * ANALOG_WRITE と同じピンにしか出せない。HID 版は D0/D2/D5/D6/D12 の 5 本、
     * Remap3 版は D0/D3/D5/D6/D9/D12/D15/D16 の 8 本 (variant.js を参照)。
     * それ以外のピン、または周波数 0 には RSP_ERR が返る。
     */
    SERVO: 0x26,
    /**
     * 距離計 (HC-SR04)。 [1]=Trig [2]=Echo
     *
     * RSP_DATA で**往復時間 (µs)** が返る。距離ではない。
     * cm への換算 (µs ÷ 58) は index.js が持っている。
     * 係数を変えたくなったときに基板を焼き直さずに済むため。
     *
     * 測れなかったときは 0 が返る。反応が無い (未接続 / 電源なし) 場合と、
     * Echo が戻らない (測定範囲外) 場合の両方が 0 になる。区別はしない。
     */
    DISTANCE: 0x27,

    /**
     * シリアル通信を始める。 [1..4]=ボーレート (uint32LE)
     *
     * これを送った時点でデバイスは D15 / D16 を TX / RX として使い始める。
     * 以後 D15 / D16 / A5 / A6 は RSP_ERR で弾かれる。閉じるコマンドは無い。
     */
    SERIAL_BEGIN: 0x28,
    /**
     * 送信。 [1]=バイト数 (最大 30) [2..31]=中身
     *
     * 0 終端ではないので、途中に 0 があっても切れない。
     * 文字列の組み立て (CSV・改行) は index.js が持っている。
     * デバイスは「行」も「数値」も知らない。
     */
    SERIAL_WRITE: 0x29,
    /**
     * 受信。 [1]=最大バイト数 (最大 29)
     *
     * RSP_DATA で **先頭に実際のバイト数** が付いたバイト列が返る。
     * 数値ではないので request() の raw を立てて呼ぶこと。
     *
     * 1 レポート 5 バイト + 12ms なので、30 バイトで約 85ms かかる。
     * 読み出しの上限が毎秒 330 バイト程度なのはこのため。
     */
    SERIAL_READ: 0x2A,

    /**
     * 非常停止。キーもマウスのボタンもすべて離す。
     *
     * 停止ボタンから送る。押しっぱなしのまま止まると PC が操作不能になり、
     * 利用者は Scratch の停止ボタンを押すことすらできなくなる。
     */
    PANIC: 0x2F,

    // --- キーボード (0x30 台) ---
    // デバイス側は実装済み。ブロックは段階を分けて追加する。
    /** 文字列をタイプする。 [1]=flags(0x80=続きあり) [2..31]=ASCII (0 終端) */
    KEY_TEXT: 0x30,
    /** キーを押して離す。 [1]=キーコード */
    KEY_WRITE: 0x31,
    /**
     * キーを押したままにする。 [1]=キーコード
     *
     * ブロックとしては露出していない。「[Ctrl] を押しながら〔〕」の囲みブロックが
     * 中身の前後で使う。押しっぱなしをブロックの内側に閉じ込めるため。
     */
    KEY_PRESS: 0x32,
    /** キーを離す。 [1]=キーコード。KEY_PRESS と対で使う */
    KEY_RELEASE: 0x33,
    /** キーをすべて離す。 */
    KEY_RELEASE_ALL: 0x34,
    // 0x35 は空けてある。「修飾キーと組み合わせて押す」を 1 コマンドで行う
    // KEY_SHORTCUT を置いていたが、消した。キーボードにそんなキーは無い。
    // あるのは「キーを押す」と「修飾キーを押したままにする」だけで、
    // 組み合わせは「[Ctrl] を押しながら〔 〕」の囲みブロックが表す。

    // --- マウス (0x40 台) ---
    // 0x44 はデバイス → Scratch のログマーカーと同じ値なので空けてある。
    /** 相対移動。 [1..2]=dx int16LE [3..4]=dy int16LE */
    MOUSE_MOVE: 0x40,
    /** ホイールを回す。 [1]=符号付きの回数 */
    MOUSE_WHEEL: 0x41,
    /** クリック。 [1]=ボタン */
    MOUSE_CLICK: 0x42,
    /**
     * ボタンを押したままにする。 [1]=ボタン
     *
     * ブロックとしては露出していない。「ドラッグしながら〔〕」の囲みブロックが
     * 中身の前後で使う。押しっぱなしをブロックの内側に閉じ込めるため。
     */
    MOUSE_PRESS: 0x43,
    /** ボタンを離す。 [1]=ボタン。MOUSE_PRESS と対で使う */
    MOUSE_RELEASE: 0x45,
    /** ボタンをすべて離す。 */
    MOUSE_RELEASE_ALL: 0x46,
    /** ダブルクリック。 [1]=ボタン。判定時間があるのでデバイス側で完結させる */
    MOUSE_DBLCLICK: 0x47,
    /** ドラッグ。 [1..2]=dx int16LE [3..4]=dy int16LE [5]=ボタン。押す→動かす→離すを一括 */
    MOUSE_DRAG: 0x48,

    // --- NeoPixel (0x60 台) ---
    //
    // デバイスは色を作らない。虹・回転・減衰・HSV の計算はすべて index.js にあり、
    // ここを通るのは出来上がった RGB だけ。1 コマンドの往復が 12〜15ms あるので
    // LED を 1 個ずつ送るとアニメーションにならず、index.js が鏡のバッファを持って
    // SHOW でまとめて出す形にしてある。
    //
    // 0x50 台を避けたのは MARKER (0x50 / 0x52 / 0x53 / 0x54) と紛らわしいため。
    /**
     * 使い始める。 [1]=LED の個数 (1-64)
     *
     * 個数を持っているのは Scratch 側で、デバイスは言われた数を覚えるだけ。
     * だから LED を増やしても基板を焼き直さずに済む。
     *
     * ⚠ 個数は「多めに送っても害がない」値ではない。デバイスは show() の間
     *   割り込みを止めるので (NEOPIXELMIN_ATOMIC)、その時間が個数に比例する。
     *   1 個あたり 32µs。12 個なら 0.38ms だが、64 個だと 2.05ms 止まり、
     *   USB がホストの問い合わせに応えられなくなる。
     *
     * これを送った時点でデバイスは D8 (SPI1 MOSI) を使い始める。
     * 以後 D8 は RSP_ERR で弾かれる。閉じるコマンドは無い。
     */
    NEO_BEGIN: 0x60,
    /**
     * 連続する何個かの色を書く。 [1]=開始番号 (0 から) [2]=個数 (1-9) [3..31]=RGB × 個数
     *
     * 1 コマンドで 9 個分。Feature Report 32 バイトのうち色に使えるのは
     * [3..31] の 29 バイトで、3 バイト × 9 = 27 が収まる上限。
     *
     * ⚠ ブロックの「1 番」はここでは 0。変換は index.js が持つ。
     */
    NEO_SET: 0x61,
    /**
     * 範囲を 1 色で埋める。 [1]=開始番号 [2]=個数 (0=最後まで) [3]=R [4]=G [5]=B
     *
     * index.js が使うのは消灯 (全部 0) のときだけ。それ以外の塗りつぶしは
     * 鏡のバッファを書いて NEO_SET で送る。これを残してあるのは
     * 停止時の消灯を 1 往復で済ませるため。
     */
    NEO_FILL: 0x62,
    /** 送り出す。パラメータなし。これを送るまで LED は変わらない。 */
    NEO_SHOW: 0x63,
    /**
     * 明るさ。 [1]=0-255
     *
     * 非破壊的。バッファの値は変えず、送り出すときだけ掛かる。
     * だから明るさを変えた後も、SHOW を送れば色を入れ直さずに反映される。
     */
    NEO_BRIGHTNESS: 0x64
};

/**
 * マウスのボタン。デバイス側 Mouse.h の MOUSE_LEFT / RIGHT / MIDDLE と同じ値。
 * ブロックのメニューの値としてもそのまま使う。
 */
const MOUSE_BUTTON = {
    LEFT: 0x01,
    RIGHT: 0x02,
    MIDDLE: 0x04
};

/**
 * UIAPduino → Web の Input Report 先頭バイト (マーカー)。
 * コマンド応答以外にも、デバイスは非同期にコンソール出力とログを投げてくる。
 */
const MARKER = {
    /** コンソール出力 (hid.Print / hid.Println 相当) */
    CONSOLE: 0x50,
    /** コマンド応答 */
    RSP: 0x52,
    /** デバイスログ ('D') */
    LOG: 0x44,
    /**
     * シリアルの受信通知。デバイスが応答とは無関係に勝手に送ってくる。
     *
     * 中身は無い。「読むものがある」としか言っていない。
     * 何行あるか、どこで区切るかは index.js 側が決める。
     *
     * デバイスは 1 回知らせたら、読みに来るまで黙る。読んでも残っていれば
     * また知らせるので、これを合図に空になるまで読み続けられる。
     */
    SERIAL: 0x54
};

/**
 * コマンド応答のステータス (Input Report の [1])。
 * uiapruby の rsp() と同じ値。
 */
const RSP = {
    /** 正常終了。戻り値なし。 */
    OK: 0,
    /** エラー終了。 */
    ERR: 1,
    /** 戻り値の一部。[2]=このレポートに載っているバイト数 (0..5)、[3..7]=中身。 */
    DATA: 2,
    /** 戻り値の終端。 */
    END: 3
};

/** コンソール出力のフラグ (Input Report の [1]) */
const CONSOLE_MORE = 0x80;

/** 応答が返らない場合に諦めるまでの時間 (ms) */
const COMMAND_TIMEOUT = 3000;

/**
 * ── ワイヤフォーマット ──────────────────────────────────────────────────────
 *
 * Web → UIAPduino  Feature Report (32 バイト)
 *
 *   [0]    コマンド ID (CMD.*)
 *   [1..]  パラメータ
 *
 * UIAPduino → Web  Input Report (8 バイト)
 *
 *   コマンド応答
 *     [0]    0x52 (MARKER.RSP)
 *     [1]    ステータス (RSP.*)
 *     [2]    ペイロード長 (0..5)
 *     [3..7] ペイロード
 *
 *   コンソール出力
 *     [0]    0x50 (MARKER.CONSOLE)
 *     [1]    フラグ (0x80 = 続きあり)
 *     [2..7] テキスト (0 終端)
 *
 *   デバイスログ
 *     [0]    0x44 (MARKER.LOG)
 *     [1]    ログ種別
 *     [2..7] 付随データ
 *
 * 戻り値を返すコマンドは RSP.DATA を必要な回数繰り返してから RSP.END で終端する。
 * 戻り値のないコマンドは RSP.OK だけを返す。
 *
 * ── シーケンス番号がないことによる制約 ──────────────────────────────────────
 * このワイヤフォーマットには送受を対応付ける番号がない。
 * したがってタイムアウト後に遅れて届いた応答は、次のコマンドの応答と区別できない。
 * ここでは「待ち手がいない応答は捨てる」ことしかできないので、
 * タイムアウトが起きた時点で警告を出し、キューのクリアか再接続を促す。
 */

class UiapduinoProcessor {
    /**
     * @param {number} sketchVariant - 相手にするスケッチの版 (variant*.js の SKETCH_VARIANT)。
     *   接続時に基板が名乗る版とこれを比べ、違えば繋がない。
     */
    constructor (sketchVariant) {
        this.sketchVariant = sketchVariant;
        this.device = null;
        this.featureReportSize = FEATURE_REPORT_SIZE;

        /**
         * ハンドシェイクまで終わっているか。
         *
         * HIDDevice.open() が済んだだけの状態 (transport open) と区別する。
         * open 直後はまだ「UIAPduino として通信できる」とは限らないので、
         * PING でプロトコルを照合できたときだけ true にする。
         * 外部に見せる isConnected() はこちらを見る。
         */
        this.ready = false;

        /**
         * 接続処理中の Promise。null なら接続処理は走っていない。
         *
         * ステータスボタンと接続ブロックから同時に接続を始められるので、
         * これが無いと二重 open と二重ハンドシェイクが起きる。
         */
        this.connecting = null;

        /** 送信待ちコマンドの配列。要素は {payload, resolve, reject} */
        this.queue = [];
        /** 現在応答待ちのコマンド。null なら送信可能。 */
        this.pending = null;
        /** タイムアウトが起きて送受のずれが疑われる状態か */
        this.desyncSuspected = false;

        /** コンソール出力の組み立てバッファ (マルチバイト文字がチャンクをまたぐため) */
        this.consoleBytes = [];

        /** navigator.hid の disconnect を購読済みか (重複登録を避ける) */
        this.disconnectHooked = false;

        /**
         * デバイスのコンソール出力を受け取るコールバック。
         * 既定では開発者コンソールに出す。差し替えれば Scratch 側に見せられる。
         * @param {string} text - デコード済みテキスト
         */
        this.onConsoleText = text => console.log(`[uiapduino] ${text}`);

        /**
         * USB が抜かれたことを上位へ知らせるコールバック。
         *
         * processor は Scratch Runtime を知らないので、イベントの emit は index.js に任せる。
         * 意図的な disconnect() では呼ばない。物理切断のときだけ呼ぶ。
         */
        this.onDisconnected = null;

        /**
         * シリアルの受信通知を受け取るコールバック。
         *
         * デバイス側の「割り込み」がここまで届く。処理は index.js が持つ。
         * ここでは読みにも行かない。何を読むか決めるのは上位の仕事。
         */
        this.onSerialData = null;

        this._onInputReport = this._onInputReport.bind(this);
    }

    /**
     * HIDDevice が open されているか。
     *
     * ハンドシェイク中はまだ isConnected() が false なので、
     * PING を送る経路とキューの送信判定はこちらを使う。
     *
     * @returns {boolean} open 済みなら true
     */
    isTransportOpen () {
        return Boolean(this.device && this.device.opened);
    }

    /**
     * UIAPduino として通信できる状態か。
     *
     * open しただけでは true にならない。プロトコル照合まで終わっている必要がある。
     * Scratch GUI がステータスボタンの表示を決めるために同期的に読む。
     *
     * @returns {boolean} ハンドシェイク済みなら true
     */
    isConnected () {
        return this.ready && this.isTransportOpen();
    }

    /**
     * UIAPduino に接続する。
     *
     * デバイスの取得から PING によるプロトコル照合までを一度に行う。
     * 呼び出し中に再度呼ばれても接続処理は 1 回だけ走る。
     *
     * NOTE: requestDevice() は Chromium 側でユーザ操作 (実際のクリック) を要求する。
     *       Scratch のブロック実行は VM のループから呼ばれておりユーザ操作とみなされないため、
     *       ブロックから呼ぶと失敗する可能性がある。
     *       scratch-desktop の main プロセスで setDevicePermissionHandler を設定してあるので
     *       通常は getDevices() だけで取得できる想定。
     *       uiap-hid-web は全ページ requestDevice() のみで getDevices() を使っていないため、
     *       この経路はサイト側では一度も踏まれていない。実機で最初に検証すべき箇所。
     *
     * @returns {Promise<{ok: boolean, reason: ?string, error: ?Error}>} 接続結果。
     *          成功なら {ok: true}、失敗なら REASON.* を載せた {ok: false, reason, error?}
     */
    connect () {
        if (this.isConnected()) return Promise.resolve({ok: true});
        // 既に接続処理が走っているなら、その Promise に相乗りさせる。
        // ステータスボタンと接続ブロックの同時操作で二重 open させないため。
        if (this.connecting) return this.connecting;

        this.connecting = this._connect()
            // connect() は reject しない契約にしておく。
            // ここで拾い損ねるとガードが解除されず、二度と接続できなくなる。
            .catch(e => {
                console.error('[uiapduino] connect failed:', e);
                this._teardown();
                return {ok: false, reason: REASON.UNKNOWN, error: e};
            })
            .then(result => {
                this.connecting = null;
                return result;
            });
        return this.connecting;
    }

    /**
     * connect() の中身。ガードは呼び出し側で済んでいる前提。
     *
     * 途中で失敗した場合は必ず未接続状態へ戻してから返す。
     * ready のまま抜ける経路を作らないこと。
     *
     * @returns {Promise<{ok: boolean, reason: ?string, error: ?Error}>} 接続結果
     */
    async _connect () {
        // 前回の失敗や物理切断で device が残っていることは無い想定だが、
        // 残っていたら古いリスナごと捨ててから始める。
        if (this.device) this._teardown();

        if (!navigator.hid) {
            console.error('[uiapduino] WebHID is not available in this environment');
            return {ok: false, reason: REASON.NO_API};
        }

        let device;
        try {
            device = await this._findDevice();
        } catch (e) {
            // requestDevice() はユーザ操作が無いと SecurityError を投げる。
            // 利用者から見れば「選べなかった」なので取得失敗と同じ扱いにする。
            console.error('[uiapduino] device lookup failed:', e);
            return {ok: false, reason: REASON.NOT_FOUND_OR_CANCELLED, error: e};
        }

        if (!device) {
            console.warn('[uiapduino] device not found');
            return {ok: false, reason: REASON.NOT_FOUND_OR_CANCELLED};
        }

        try {
            if (!device.opened) {
                await device.open();
            }
        } catch (e) {
            console.error('[uiapduino] open failed:', e);
            return {ok: false, reason: REASON.OPEN_FAILED, error: e};
        }

        try {
            this._attach(device);
            await this._sendConnectNotify();

            // デバイス側スケッチとプロトコルが一致しているか確かめる。
            // ここで弾かないと、噛み合わないコマンドを送り続けることになる。
            const handshake = await this._checkVersion();
            if (!handshake.ok) {
                this._teardown();
                return handshake;
            }

            this.ready = true;
            return {ok: true};
        } catch (e) {
            console.error('[uiapduino] connect failed:', e);
            this._teardown();
            return {ok: false, reason: REASON.UNKNOWN, error: e};
        }
    }

    /**
     * 接続先の HIDDevice を探す。
     *
     * 既に許可済みのデバイスがあれば getDevices() で拾う。無ければ requestDevice() を試す。
     *
     * @returns {Promise<?HIDDevice>} 見つかったデバイス。無ければ null
     */
    async _findDevice () {
        const granted = (await navigator.hid.getDevices()).filter(d => (
            d.vendorId === DEVICE_FILTER.vendorId &&
            d.productId === DEVICE_FILTER.productId
        ));
        // USB 設定が Keyboard+Mouse+WebHID の場合、同じ VID/PID で
        // キーボード / マウスのコレクションも見えることがある。
        // ベンダー定義コレクション (0xFF00 / 0x01) を持つものを優先する。
        const device = granted.find(d => (d.collections || []).some(c => (
            c.usagePage === DEVICE_FILTER.usagePage &&
            c.usage === DEVICE_FILTER.usage
        ))) || granted[0];
        if (device) return device;

        const devices = await navigator.hid.requestDevice({filters: [DEVICE_FILTER]});
        return devices[0] || null;
    }

    /**
     * open 済みの HIDDevice を processor に結び付ける。
     * この時点ではまだ ready ではない。送れるのはハンドシェイクだけ。
     * @param {HIDDevice} device - open 済みのデバイス
     * @returns {void}
     */
    _attach (device) {
        this._hookDisconnect();

        // 再接続時に Chromium が同じ HIDDevice を使い回すことがあるため、
        // 二重登録にならないよう一度外してから付ける。
        device.removeEventListener('inputreport', this._onInputReport);
        device.addEventListener('inputreport', this._onInputReport);
        this.device = device;
        this.featureReportSize = this._detectFeatureReportSize(device);
        this.consoleBytes = [];
        this.desyncSuspected = false;
    }

    /**
     * PING を投げてプロトコルのバージョンを照合する。
     *
     * デバイス側スケッチは PING に対しバージョンを DATA で返す。
     * バージョンを持たない世代のスケッチは RSP_OK だけを返すので、
     * リクエストは 0 で resolve する。これで世代を見分けられる。
     *
     * まだ ready ではないので、通常の request() ではなくハンドシェイク用の経路を使う。
     *
     * @returns {Promise<{ok: boolean, reason: ?string}>} 一致していれば {ok: true}
     */
    async _checkVersion () {
        let raw;
        try {
            raw = await this._handshakeRequest(CMD.PING);
        } catch (e) {
            raw = HANDSHAKE.NO_RESPONSE;
        }

        // ⚠ スケッチの入手先を案内してはいけない。焼くものは拡張機能が持っている。
        //   v0.2.3 までは「リリースの sketch.zip を取ってきて Arduino IDE で焼く」を
        //   案内していたが、v0.2.4 でその zip をリリースから外した。
        //   案内すれば、置いていないものを探しに行かせることになる。
        const reflash = 'パレットの「スケッチを書き込む」ブロックで書き込めます。';
        if (raw === HANDSHAKE.NO_RESPONSE) {
            console.error(
                '[uiapduino] デバイスが応答しません。' +
                `スケッチが書き込まれていないか、別のスケッチが動いています。${reflash}`
            );
            return {ok: false, reason: REASON.HANDSHAKE_NO_RESPONSE};
        }
        if (raw === HANDSHAKE.LEGACY) {
            console.error(
                '[uiapduino] スケッチが古すぎます (バージョンを返しません)。' + reflash
            );
            return {ok: false, reason: REASON.PROTOCOL_MISMATCH};
        }

        // 下位バイト = プロトコルのバージョン、上位バイト = どの版のスケッチか。
        // 1 バイトしか返さない世代のスケッチは上位が 0 になり、HID 版として扱われる。
        const version = raw & 0xFF;
        const variant = (raw >> 8) & 0xFF;

        // 版の違いを先に見る。版が違えばコマンドの意味ごと違うので、
        // バージョン番号の一致不一致を語っても利用者の役に立たない。
        if (variant !== this.sketchVariant) {
            const found = VARIANT[variant] || `番号 ${variant} の版`;
            const want = VARIANT[this.sketchVariant] || `番号 ${this.sketchVariant} の版`;
            console.error(
                `[uiapduino] この基板には${found}のスケッチが焼かれています。` +
                `この拡張機能が使えるのは${want}です。` +
                'それぞれの版に対応した拡張機能を使うか、' + reflash
            );
            return {ok: false, reason: REASON.VARIANT_MISMATCH, variant: variant};
        }

        if (version === PROTOCOL_VERSION) return {ok: true};

        console.error(
            '[uiapduino] プロトコルのバージョンが違います。' +
            `デバイス=${version} / この拡張機能=${PROTOCOL_VERSION}。${reflash}`
        );
        return {ok: false, reason: REASON.PROTOCOL_MISMATCH};
    }

    /**
     * USB が抜かれたことを検知できるようにする。
     *
     * WebHID では物理的に切断されても HIDDevice.opened は自動的に false にならない。
     * これを購読しないと isConnected() が true を返し続け、さらに再接続時に
     * Chromium が新しい HIDDevice を作るため、古いハンドルへの送信が無視される。
     * uiap-hid-web の各ページも同じ購読をしている。
     *
     * @returns {void}
     */
    _hookDisconnect () {
        if (this.disconnectHooked || !navigator.hid) return;
        navigator.hid.addEventListener('disconnect', event => {
            if (!this.device || event.device !== this.device) return;
            console.warn('[uiapduino] device disconnected');
            this._teardown();
            // 上位 (index.js) が Scratch へ切断と接続喪失を通知する。
            if (this.onDisconnected) this.onDisconnected();
        });
        this.disconnectHooked = true;
    }

    /**
     * 接続状態を捨てる。実行待ちのコマンドはすべて reject する。
     * 物理的に外れている場合を含むので close() は呼ばない。
     * @returns {void}
     */
    _teardown () {
        this.ready = false;
        if (this.device) {
            this.device.removeEventListener('inputreport', this._onInputReport);
            this.device = null;
        }
        this.consoleBytes = [];
        // device を null にしてから捨てる (_dequeue が送信を試みないように)
        this.resetQueue();
    }

    /**
     * 切断する。
     * @returns {Promise<void>} 切断完了
     */
    async disconnect () {
        const device = this.device;
        this._teardown();
        if (device && device.opened) {
            try {
                await device.close();
            } catch (e) {
                // 既に物理的に外れている場合は close() が失敗する
                console.warn('[uiapduino] close failed:', e);
            }
        }
    }

    /**
     * 接続通知 (0x01) を送る。
     * デバイス側で WaitAvailable() が待っている場合、これを送らないと起動しない。
     * 応答は返らないので待たない。
     * @returns {Promise<void>} 送信完了
     */
    async _sendConnectNotify () {
        const payload = new Uint8Array(this.featureReportSize);
        payload[0] = CMD.CONNECT_NOTIFY;
        try {
            await this.device.sendFeatureReport(REPORT_ID, payload);
        } catch (e) {
            // 接続通知を受け取らないスケッチもあるので、失敗しても接続自体は続行する
            console.warn('[uiapduino] connect notify failed:', e);
        }
    }

    /**
     * HID ディスクリプタから Feature Report の実サイズを取得する。
     * arduino_core_ch32 のバージョンによって 16 / 32 バイトと異なるため。
     * @param {HIDDevice} device - 接続済みデバイス
     * @returns {number} Feature Report のバイト数
     */
    _detectFeatureReportSize (device) {
        for (const collection of device.collections || []) {
            const reports = collection.featureReports || [];
            // 番号なしレポート (reportId === 0) を優先する。uiap-hid-web と同じ選び方。
            const report = reports.find(r => r.reportId === REPORT_ID) || reports[0];
            if (!report) continue;
            const bits = (report.items || []).reduce(
                (sum, item) => sum + ((item.reportSize || 0) * (item.reportCount || 0)),
                0
            );
            if (bits > 0) return Math.ceil(bits / 8);
        }
        return FEATURE_REPORT_SIZE;
    }

    /**
     * コマンドをキューに積む。
     *
     * 応答を待つ Promise を返すので、ブロック側でそのまま return すれば
     * Scratch がデバイスの完了を待ってから次のブロックに進む。
     *
     * @param {number} command - CMD.* のいずれか
     * @param {Array<number>} params - パラメータのバイト列
     * @param {number} [timeout] - 応答を諦めるまでの時間 (ms)
     * @param {boolean} [raw] - true ならバイト列のまま返す。false なら数値にする
     * @returns {Promise<number|Array<number>>} 戻り値。戻り値のないコマンドは 0
     */
    request (command, params = [], timeout = COMMAND_TIMEOUT, raw = false) {
        if (!this.isConnected()) {
            return Promise.reject(new Error('uiapduino is not connected'));
        }
        return this._enqueue(command, params, timeout, raw);
    }

    /**
     * ハンドシェイク専用のコマンド送信。
     *
     * PING は ready になる前に送る必要があるので、request() のゲートを通せない。
     * かといって request() のゲートを緩めると、ハンドシェイク中に通常ブロックの
     * コマンドまで通ってしまう。専用の経路を分けておく。
     *
     * @param {number} command - CMD.* のいずれか
     * @param {Array<number>} [params] - パラメータのバイト列
     * @param {number} [timeout] - 応答を諦めるまでの時間 (ms)
     * @returns {Promise<number>} 戻り値
     */
    _handshakeRequest (command, params = [], timeout = COMMAND_TIMEOUT) {
        if (!this.isTransportOpen()) {
            return Promise.reject(new Error('uiapduino transport is not open'));
        }
        return this._enqueue(command, params, timeout);
    }

    /**
     * コマンドを組み立ててキューに積む。接続状態の判定は呼び出し側の責任。
     * @param {number} command - CMD.* のいずれか
     * @param {Array<number>} params - パラメータのバイト列
     * @param {number} timeout - 応答を諦めるまでの時間 (ms)
     * @param {boolean} [raw] - true ならバイト列のまま返す
     * @returns {Promise<number|Array<number>>} 戻り値
     */
    _enqueue (command, params, timeout, raw = false) {
        const payload = new Uint8Array(this.featureReportSize);
        payload[0] = command;
        params.forEach((value, i) => {
            payload[1 + i] = value & 0xFF;
        });

        return new Promise((resolve, reject) => {
            this.queue.push({command, payload, timeout, raw, resolve, reject, data: []});
            this._dequeue();
        });
    }

    /**
     * 実行待ちのコマンドをすべて捨てる。
     * Tello 拡張の「実行待ちのコマンドをクリアする」ブロックと同じ用途。
     * @returns {void}
     */
    resetQueue () {
        const dropped = this.queue.splice(0, this.queue.length);
        for (const item of dropped) {
            item.reject(new Error('command queue cleared'));
        }
        this._clearPending(new Error('command queue cleared'));
        this.desyncSuspected = false;
    }

    /**
     * キューの先頭を送信する。応答待ちの間は何もしない。
     * @returns {void}
     */
    _dequeue () {
        if (this.pending || this.queue.length === 0) return;
        // ハンドシェイク中はまだ ready ではないので transport だけを見る。
        if (!this.isTransportOpen()) {
            // 応答の処理中に切断された場合。残りは捨てる。
            this.resetQueue();
            return;
        }

        const item = this.queue.shift();
        this.pending = item;
        this._armTimer(item);

        this.device.sendFeatureReport(REPORT_ID, item.payload)
            .catch(e => {
                this._clearPending(e);
                this._dequeue();
            });
    }

    /**
     * 応答待ちのタイムアウトを (再) 設定する。
     * RSP.DATA が届くたびに掛け直すので、長い戻り値でも途中で切れない。
     * @param {object} item - 応答待ちのコマンド
     * @returns {void}
     */
    _armTimer (item) {
        clearTimeout(item.timer);
        item.timer = setTimeout(() => {
            // シーケンス番号がないため、ここで遅れて届く応答と次のコマンドの応答は区別できない
            this.desyncSuspected = true;
            console.warn(
                `[uiapduino] command 0x${item.command.toString(16)} timed out. ` +
                '応答がずれている可能性があります。キューをクリアするか再接続してください。'
            );
            this._clearPending(new Error(`command timed out (0x${item.command.toString(16)})`));
            this._dequeue();
        }, item.timeout);
    }

    /**
     * 応答待ちを解除する。理由が渡されたら reject する。
     * @param {Error} [error] - 失敗理由
     * @returns {void}
     */
    _clearPending (error) {
        if (!this.pending) return;
        clearTimeout(this.pending.timer);
        if (error) this.pending.reject(error);
        this.pending = null;
    }

    /**
     * 応答待ちを完了させて次へ進む。
     * @param {Error} [error] - 失敗理由。無ければ value で resolve する
     * @param {number} [value] - 戻り値
     * @returns {void}
     */
    _finishPending (error, value) {
        const item = this.pending;
        if (!item) return;
        clearTimeout(item.timer);
        this.pending = null;
        if (error) {
            item.reject(error);
        } else {
            item.resolve(value);
        }
        this._dequeue();
    }

    /**
     * UIAPduino からの Input Report を処理する。
     * コマンド応答のほかに、コンソール出力とデバイスログが非同期に届く。
     * @param {HIDInputReportEvent} event - inputreport イベント
     * @returns {void}
     */
    _onInputReport (event) {
        const view = event.data;
        if (view.byteLength < INPUT_REPORT_SIZE) return;

        const d = new Uint8Array(INPUT_REPORT_SIZE);
        for (let i = 0; i < INPUT_REPORT_SIZE; i++) {
            d[i] = view.getUint8(i);
        }

        switch (d[0]) {
        case MARKER.RSP:
            this._handleResponse(d);
            break;
        case MARKER.CONSOLE:
            this._handleConsole(d);
            break;
        case MARKER.LOG:
            this._handleLog(d);
            break;
        case MARKER.SERIAL:
            // 応答待ちの有無とは無関係に届く。pending には触らない。
            if (this.onSerialData) this.onSerialData();
            break;
        default:
            // 未知のパケット。将来 0x51 (GetPos) などを扱うならここに足す。
            break;
        }
    }

    /**
     * コマンド応答 (0x52) を処理する。
     * @param {Uint8Array} d - Input Report 8 バイト
     * @returns {void}
     */
    _handleResponse (d) {
        if (!this.pending) {
            // タイムアウト後に遅れて届いた応答。対応付ける手段がないので捨てる。
            console.warn('[uiapduino] response arrived with no pending command; dropped');
            return;
        }

        const status = d[1];
        const length = Math.min(d[2], INPUT_REPORT_SIZE - 3);

        switch (status) {
        case RSP.OK:
            this._finishPending(null, 0);
            break;
        case RSP.ERR:
            this._finishPending(new Error(`uiapduino returned RSP_ERR (0x${this.pending.command.toString(16)})`));
            break;
        case RSP.DATA:
            for (let i = 0; i < length; i++) {
                this.pending.data.push(d[3 + i]);
            }
            // まだ続きが来るので待ち直す
            this._armTimer(this.pending);
            break;
        case RSP.END:
            // END で終わる応答は必ず 1 つ以上の DATA を伴う。
            // DATA が 1 つも無いのは、ホストのポーリングのばらつきで
            // DATA レポートが上書き消失した場合。0 を正常値として返すと
            // センサー値が黙って 0 になるので、エラーとして表に出す。
            if (this.pending.data.length === 0) {
                this._finishPending(new Error('uiapduino response lost its payload (RSP_DATA missing)'));
            } else if (this.pending.raw) {
                // シリアルの読み出しはバイト列そのものが欲しい。
                // 数値にすると 5 バイトを超えたところで精度が壊れる。
                this._finishPending(null, this.pending.data.slice());
            } else {
                this._finishPending(null, this._toValue(this.pending.data));
            }
            break;
        default:
            this._finishPending(new Error(`uiapduino returned unknown status ${status}`));
            break;
        }
    }

    /**
     * RSP.DATA で集めたバイト列をリトルエンディアンの数値にする。
     * @param {Array<number>} bytes - 集めたバイト列
     * @returns {number} 数値。バイトが無ければ 0
     */
    _toValue (bytes) {
        let value = 0;
        for (let i = bytes.length - 1; i >= 0; i--) {
            value = (value * 256) + bytes[i];
        }
        return value;
    }

    /**
     * コンソール出力 (0x50) を処理する。
     * 続きありフラグが落ちた時点でまとめて UTF-8 デコードする。
     * チャンク境界をマルチバイト文字がまたぐため、1 レポートずつデコードしてはいけない。
     * @param {Uint8Array} d - Input Report 8 バイト
     * @returns {void}
     */
    _handleConsole (d) {
        for (let i = 2; i < INPUT_REPORT_SIZE; i++) {
            if (d[i] === 0) break;
            this.consoleBytes.push(d[i]);
        }
        if (d[1] & CONSOLE_MORE) return;

        const text = new TextDecoder().decode(new Uint8Array(this.consoleBytes));
        this.consoleBytes = [];
        if (text.length > 0 && this.onConsoleText) {
            this.onConsoleText(text);
        }
    }

    /**
     * デバイスログ (0x44) を処理する。
     * 種別はスケッチごとに異なるので、ここでは開発者コンソールに素通しする。
     * @param {Uint8Array} d - Input Report 8 バイト
     * @returns {void}
     */
    _handleLog (d) {
        const body = Array.from(d.slice(2))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        console.log(`[uiapduino] log type=0x${d[1].toString(16).padStart(2, '0')} ${body}`);
    }
}

// ESM で書く理由は index.js の冒頭を参照。
//
// CommonJS のときは module.exports.CMD = ... とクラスの静的プロパティに生やしていたので、
// 取り込み側は const {CMD} = UiapduinoProcessor; と書けた。
// ESM の名前付きエクスポートはクラスには載らないので、
// import UiapduinoProcessor, {CMD} from './uiapduinoProcessor'; と受ける。
export default UiapduinoProcessor;
export {
    CMD, MOUSE_BUTTON, REASON, MARKER, RSP, PROTOCOL_VERSION, VARIANT,
    // 書き込みブロックが、焼いた後に基板が戻ってきたかを見るのに使う。
    DEVICE_FILTER
};
