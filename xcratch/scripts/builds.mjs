// Xcratch 版で作るモジュールの一覧。rollup.config / publish-docs が読む。
//
// 1 つのソース (scratch-vm/src/extensions/scratch3_uiapduino/) から版ごとに 1 枚ずつ作る。
// 版ごとに入口 (拡張機能のクラスを export するファイル) が違うだけで、
// 本体はどちらも同じ。HID 版の入口は index.js、Remap3 版の入口は remap3.js
// (index.js のクラスを受け継ぎ、版の値だけを差し替える)。
// 仕組みは scratch-vm/src/extensions/scratch3_uiapduino/variant.js の冒頭。
//
// ⚠ name が公開 URL のファイル名になる (docs/<name>.mjs)。公開したら二度と変えられない。
//   理由は README.md の「公開 URL」。
//
// ⚠ 版を足すときは、ここと entry-*/ と入口のファイル・variant*.js を揃えること。
//   entry の extensionId / extensionURL と variant*.js の EXTENSION_ID / EXTENSION_URL は
//   同じ値でなければならない。

/**
 * @typedef {object} Build
 * @property {string} name - 出力するモジュールの名前 (<name>.mjs)
 * @property {string} blockFile - 入口のファイル (src/vm/extensions/block/ の中)
 * @property {string} entryDir - 一覧のカードを作るファイルの場所 (src/gui/lib/libraries/extensions/ の下)
 */

/** @type {Array<Build>} */
export const BUILDS = [
    {
        // HID 版。Tools → PWM = TIM2 Default
        name: 'uiapduino',
        blockFile: 'index.js',
        entryDir: 'entry'
    },
    {
        // Remap3 版。Tools → PWM = TIM2 Remap3。PWM を 8 本出せる
        name: 'uiapduino-remap3',
        blockFile: 'remap3.js',
        entryDir: 'entry-remap3'
    }
];
