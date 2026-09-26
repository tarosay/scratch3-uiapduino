// scratch3-uiapduino / variant.js
// Created by tarosay (2026)
//
// 版ごとに違う値だけを集めたファイル。これは HID 版 (Tools → PWM = TIM2 Default)。
//
// ⚠ 1 つのソースから 2 つの版を作っている。index.js と uiapduinoProcessor.js は
//   両方の版で同じもので、違いはこのファイルと同梱の .bin だけ。
//
//   HID 版     variant.js         ← このファイル。デスクトップ版と Xcratch 版の uiapduino.mjs
//   Remap3 版  variantRemap3.js   Xcratch 版の uiapduino-remap3.mjs
//
//   Xcratch 版のビルドでは sync-block.mjs が、版ごとにどちらかを
//   variant.js という名前で置く。本体は常に './variant' を読むので、
//   本体のコードに版の分岐は無い。
//
//   ここに無い違いを本体に書き足さないこと。書くなら先にここへ値を足す。
//   分岐が本体に散ると、片方だけ直して他方を直し忘れる。
//
// ⚠ 2 つのファイルは同じ名前を export すること。片方にしか無いと、
//   その版のビルドだけが落ちる。

// 同梱する .bin。embed-bin.mjs の生成物で、手で書かない。
export {
    SKETCH_BIN_BASE64, SKETCH_BIN_SIZE, SKETCH_BIN_PROTOCOL_VERSION
} from './sketchBin';

/**
 * この拡張機能が相手にするスケッチの版。
 *
 * sketches/ScratchUiapduino の SKETCH_VARIANT と同じ値でなければならない。
 * 番号の意味は uiapduinoProcessor.js の VARIANT を参照。
 * @type {number}
 */
export const SKETCH_VARIANT = 0;

/**
 * 拡張機能 ID。
 *
 * getInfo() の id、Peripheral Extension API への登録、接続喪失イベントの payload で
 * 同じ値を使う。ここがずれるとステータスボタンが別拡張を見に行く。
 *
 * ⚠ 版ごとに必ず別の値にすること。同じにすると、片方の版で作ったプロジェクトが
 *   もう片方の拡張機能を掴む (xcratch/README.md の「公開 URL」)。
 * @type {string}
 */
export const EXTENSION_ID = 'uiapduino';

/**
 * Xcratch にモジュールとして読み込ませたときの、このモジュール自身の URL。
 *
 * ⚠ 公開したら二度と変えられない。理由は index.js の extensionURL を参照。
 *   xcratch/src/gui/.../entry/index.jsx の extensionURL と必ず同じ値にすること。
 * @type {string}
 */
export const EXTENSION_URL = 'https://tarosay.github.io/scratch3-uiapduino/uiapduino.mjs';

/**
 * パレットのカテゴリ名。
 * @type {string}
 */
export const EXTENSION_NAME = 'UIAPduino';

/**
 * ブロックの色 [本体, 入力欄・メニュー, 枠線]。getInfo() の color1 / color2 / color3 になる。
 *
 * HID 版は null。scratch-vm の既定の緑 (#0FBD8C / #0DA57A / #0B8E69) のまま出る
 * (scratch-vm の src/engine/runtime.js、defaultExtensionColors)。
 * @type {?Array<string>}
 */
export const EXTENSION_COLORS = null;

/**
 * ブロックパレットのカテゴリ一覧に出す絵 (data URI)。
 *
 * HID 版は null。index.js がブロック左端と同じ基板の絵 (blockIconURI) を使う。
 * @type {?string}
 */
export const MENU_ICON_URI = null;

/**
 * 「サーボ [ ] を [ ] 度にする」のピンのメニュー。
 *
 * PWM を出せる 5 本だけを並べる。Tools → PWM = TIM2 Default のときの
 * TIM1 = D0 / D5 / D6 / D12、TIM2 = D2 がそれにあたる。
 * 数値入力にしていないのは、サーボの繋がらないピンを選べてしまうため。
 *
 * ⚠ 表記と値が食い違って見えるが、間違いではない。
 *   基板のシルクは PA1 = A1、PC4 = A2、PD2 = A3 で、Arduino 番号は 0 / 6 / 12。
 *   基板に書いてある名前で選ばせ、デバイスへは Arduino 番号を送る。
 *
 *   この A1 / A2 / A3 は「A1 の値」のアナログ入力ブロックと同じ物理ピンを指す
 *   (ADC のチャンネル 1 / 2 / 3 が PA1 / PC4 / PD2)。表記は揃っている。
 * @type {Array<{text: string, value: string}>}
 */
export const PWM_PIN_ITEMS = [
    {text: '2', value: '2'},
    {text: '5', value: '5'},
    {text: 'A1', value: '0'},
    {text: 'A2', value: '6'},
    {text: 'A3', value: '12'}
];

/**
 * PWM を出すブロック (アナログ出力とサーボ) の既定ピン。
 *
 * D2 はオンボード LED でもあるので、繋がなくても動きが確かめられる。
 * @type {number}
 */
export const PWM_DEFAULT_PIN = 2;
