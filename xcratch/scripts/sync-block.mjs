#!/usr/bin/env node
//
// 拡張本体を src/vm/extensions/<blockDir>/ へコピーする。npm run build の前に自動で走る。
//
// 実体は scratch-vm/src/extensions/scratch3_uiapduino/ にあり、デスクトップ版と共有している。
// 直すのは必ずそちら。ここに置かれるのは複製で、ビルドのたびに上書きされる
// (.gitignore で追跡もしていない)。
//
// 版 (HID 版 / Remap3 版) ごとに 1 つずつ複製を作る。版の一覧は builds.mjs。
// 本体は両方の版で同じファイルで、版ごとに違うのは variant.js だけ。
// Remap3 版の複製には variantRemap3.js を variant.js という名前で置く。
// 本体は常に './variant' を読むので、本体のコードに版の分岐は要らない。
//
// ── なぜリンクではなくコピーなのか ────────────────────────────────────────
// 最初はジャンクションで繋いでいたが、rollup がリンクを実体パスへ解決するため、
// 本体の中の `../../util/cast` がこのリポジトリ側 (scratch-vm/src/util) を指してしまい、
// そこには何も置いていないので解決できなかった。
// rollup の preserveSymlinks を立てても変わらなかった。
// 実ファイルとして置けば、xcx-example と同じ形になり小細工が要らない。
// 版の差し替えもコピーだから素直にできる。

import path from 'path';
import fs from 'fs-extra';
import {BUILDS} from './builds.mjs';

const projectDir = process.cwd();
const srcDir = path.resolve(projectDir, '../scratch-vm/src/extensions/scratch3_uiapduino');

// ⚠ 拡張本体が読むファイルを増やしたら、ここにも足すこと。
//   足さないと複製されず、rollup が解決できずにビルドが落ちる。
//   版ごとのファイル (variant*.js と sketchBin*.js) は builds.mjs が持つ。
const files = ['index.js', 'uiapduinoProcessor.js', 'rv003usbFlasher.js'];

if (!fs.existsSync(srcDir)) {
    console.error(`拡張本体が見つかりません: ${srcDir}`);
    process.exit(1);
}

/**
 * 1 ファイルを複製する。無ければそこで止める。
 * @param {string} name - 複製元のファイル名 (srcDir の中)
 * @param {string} dstDir - 複製先のディレクトリ
 * @param {string} [as] - 複製先での名前。省略すると同じ名前
 * @returns {void}
 */
const copy = (name, dstDir, as = name) => {
    const from = path.resolve(srcDir, name);
    if (!fs.existsSync(from)) {
        console.error(`ありません: ${from}`);
        process.exit(1);
    }
    fs.copySync(from, path.resolve(dstDir, as));
    console.log(`コピー: ${name}${as === name ? '' : ` -> ${as}`}`);
};

BUILDS.forEach(build => {
    const dstDir = path.resolve(projectDir, 'src/vm/extensions', build.blockDir);
    // 前のビルドの残りを消す。版を入れ替えたときに、別の版の sketchBin*.js が
    // 残っていても誰も読まないが、紛らわしい。
    fs.emptyDirSync(dstDir);
    console.log(`[${build.name}] -> src/vm/extensions/${build.blockDir}`);
    files.forEach(name => copy(name, dstDir));
    copy(build.variant, dstDir, 'variant.js');
    copy(build.sketchBin, dstDir);
});
