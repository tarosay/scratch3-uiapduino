/**
 * Xcratch の拡張機能一覧に出す情報。Remap3 版 (uiapduino-remap3.mjs)。
 *
 * 中身は entry/createEntry.js が作る。ここに書くのは版ごとに違う値だけ。
 * HID 版は entry/index.jsx。
 */

import createEntry from '../entry/createEntry';
import translations from './translations.json';
// カードの大きな絵。uiapduino.png の緑 (背景・キーボード・マウス・LED) を
// ブロックの色 #3F51B5 の青に置き換えたもの。
import iconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-remap3.png';
// カード左下の小さな絵。uiapduino-small.png の灰色の線を #3F51B5 に塗り替えたもの。
//
// ⚠ 背景は透明のままにすること。後ろに Xcratch の CSS が緑の四角を敷いており、
//   ほかの拡張機能はどれも透明な絵をその上に載せている。カテゴリ一覧の絵
//   (uiapduino-remap3-menu.png、青い丸で塗りつぶしたもの) を一度ここにも使ったが、
//   緑の四角の中に青い丸が浮いて、一覧の中で 1 つだけ浮いて見えた。
import insetIconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-remap3-small.png';

const entry = createEntry({
    // scratch-vm/src/extensions/scratch3_uiapduino/variantRemap3.js の EXTENSION_ID と同じ値
    extensionId: 'uiapduinoRemap3',
    // 同じく EXTENSION_URL と同じ値。
    // ⚠ まだ公開していない。名前が決まったら、公開する前に両方を直すこと
    extensionURL: 'https://tarosay.github.io/scratch3-uiapduino/uiapduino-remap3.mjs',
    name: 'UIAPduino Remap3',
    description: 'UIAPduino with 8 PWM pins. Chrome or Edge is required to connect to UIAPduino.',
    translations: translations,
    iconURL: iconURL,
    insetIconURL: insetIconURL
});

export {entry}; // loadable-extension needs this line.
export default entry;
