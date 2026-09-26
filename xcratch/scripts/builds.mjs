// Xcratch 版で作るモジュールの一覧。sync-block / rollup.config / publish-docs が読む。
//
// 1 つのソース (scratch-vm/src/extensions/scratch3_uiapduino/) から版ごとに 1 枚ずつ作る。
// 版で違うのは variant*.js と、それが読む sketchBin*.js だけ。
// どちらの版も本体は './variant' を読むので、複製するときに版のファイルを
// variant.js という名前で置く (sync-block.mjs)。
//
// ⚠ name が公開 URL のファイル名になる (docs/<name>.mjs)。公開したら二度と変えられない。
//   理由は README.md の「公開 URL」。
//
// ⚠ 版を足すときは、ここと entry-*/ と variant*.js の 3 つを揃えること。
//   entry の extensionId / extensionURL と variant*.js の EXTENSION_ID / EXTENSION_URL は
//   同じ値でなければならない。

/**
 * @typedef {object} Build
 * @property {string} name - 出力するモジュールの名前 (<name>.mjs)
 * @property {string} blockDir - 本体を複製する場所 (src/vm/extensions/ の下)
 * @property {string} variant - 版の値を持つファイル。複製先では variant.js になる
 * @property {string} sketchBin - 同梱する .bin (embed-bin.mjs の生成物)
 * @property {string} entryDir - 一覧のカードを作るファイルの場所 (src/gui/lib/libraries/extensions/ の下)
 */

/** @type {Array<Build>} */
export const BUILDS = [
    {
        // HID 版。Tools → PWM = TIM2 Default
        name: 'uiapduino',
        blockDir: 'block',
        variant: 'variant.js',
        sketchBin: 'sketchBin.js',
        entryDir: 'entry'
    },
    {
        // Remap3 版。Tools → PWM = TIM2 Remap3。PWM を 8 本出せる
        name: 'uiapduino-remap3',
        blockDir: 'blockRemap3',
        variant: 'variantRemap3.js',
        sketchBin: 'sketchBinRemap3.js',
        entryDir: 'entry-remap3'
    }
];
