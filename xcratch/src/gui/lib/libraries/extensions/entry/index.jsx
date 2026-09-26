/**
 * Xcratch の拡張機能一覧に出す情報。HID 版 (uiapduino.mjs)。
 *
 * 中身は createEntry.js が作る。ここに書くのは版ごとに違う値だけ。
 * Remap3 版は entry-remap3/index.jsx。
 */

import createEntry from './createEntry';
import translations from './translations.json';
import iconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino.png';
import insetIconURL from '../../../../../../../scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-small.png';

const entry = createEntry({
    // scratch-vm/src/extensions/scratch3_uiapduino/variant.js の EXTENSION_ID と同じ値
    extensionId: 'uiapduino',
    // 同じく EXTENSION_URL と同じ値。⚠ 公開済み。二度と変えられない
    extensionURL: 'https://tarosay.github.io/scratch3-uiapduino/uiapduino.mjs',
    name: 'UIAPduino',
    description: 'Create your own controller! Chrome or Edge is required to connect to UIAPduino.',
    translations: translations,
    iconURL: iconURL,
    insetIconURL: insetIconURL
});

export {entry}; // loadable-extension needs this line.
export default entry;
