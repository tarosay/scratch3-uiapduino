#!/usr/bin/env node
//
// 拡張本体を src/vm/extensions/block/ へコピーする。npm run build の前に自動で走る。
//
// 実体は scratch-vm/src/extensions/scratch3_uiapduino/ にあり、デスクトップ版と共有している。
// 直すのは必ずそちら。ここに置かれるのは複製で、ビルドのたびに上書きされる
// (.gitignore で追跡もしていない)。
//
// HID 版と Remap3 版は同じ複製からビルドする。版ごとに違うのは入口のファイル
// (index.js / remap3.js) だけで、どちらを入口にするかは builds.mjs が決める。
//
// ── なぜリンクではなくコピーなのか ────────────────────────────────────────
// 最初はジャンクションで繋いでいたが、rollup がリンクを実体パスへ解決するため、
// 本体の中の `../../util/cast` がこのリポジトリ側 (scratch-vm/src/util) を指してしまい、
// そこには何も置いていないので解決できなかった。
// rollup の preserveSymlinks を立てても変わらなかった。
// 実ファイルとして置けば、xcx-example と同じ形になり小細工が要らない。

import path from 'path';
import fs from 'fs-extra';

const projectDir = process.cwd();
const srcDir = path.resolve(projectDir, '../scratch-vm/src/extensions/scratch3_uiapduino');
const dstDir = path.resolve(projectDir, 'src/vm/extensions/block');

// ⚠ 拡張本体が読むファイルを増やしたら、ここにも足すこと。
//   足さないと複製されず、rollup が解決できずにビルドが落ちる。
//   sketchBin*.js は embed-bin.mjs の生成物。
const files = [
    'index.js', 'remap3.js', 'uiapduinoProcessor.js', 'rv003usbFlasher.js',
    'variant.js', 'variantRemap3.js', 'sketchBin.js', 'sketchBinRemap3.js'
];

if (!fs.existsSync(srcDir)) {
    console.error(`拡張本体が見つかりません: ${srcDir}`);
    process.exit(1);
}

// 前のビルドの残りを消す。本体から消したファイルが複製に残っていても
// 誰も読まないが、紛らわしい。
fs.emptyDirSync(dstDir);

// 版ごとに複製を分けていた頃の置き場。今は使わないので残っていれば消す。
fs.removeSync(path.resolve(projectDir, 'src/vm/extensions/blockRemap3'));

files.forEach(name => {
    const from = path.resolve(srcDir, name);
    if (!fs.existsSync(from)) {
        console.error(`ありません: ${from}`);
        process.exit(1);
    }
    fs.copySync(from, path.resolve(dstDir, name));
    console.log(`コピー: ${name}`);
});
