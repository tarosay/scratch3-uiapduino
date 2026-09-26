// entry と拡張本体を 1 つの .mjs にまとめる。これが Xcratch に読ませるモジュール。
//
// 構成は xcratch/xcx-example (MIT License, Copyright (c) 2021-2024 Koji Yokokawa) の
// scripts/rollup.config.mjs に倣っている。Xcratch のローダは
// 「entry と blockClass を名前付きで export する 1 枚の ES モジュール」を期待しており、
// multi-entry で 2 つの入口を束ねるのがその作り方。

import path from 'path';

import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import importImage from '@rollup/plugin-image';
import multi from '@rollup/plugin-multi-entry';
import json from '@rollup/plugin-json';
import {BUILDS} from './builds.mjs';

// 版 (HID 版 / Remap3 版) ごとに 1 枚ずつ作る。一覧は builds.mjs。
//
// src/vm/extensions/block の中身は sync-block.mjs が置いた複製。
// 実体はこのリポジトリの scratch-vm/src/extensions/scratch3_uiapduino で、
// デスクトップ版とまったく同じファイルをビルドしている。版で違うのは入口
// (builds.mjs の blockFile) だけ。
/**
 * 1 つの版の rollup 設定を作る。
 * @param {import('./builds.mjs').Build} build - 版
 * @returns {object} rollup の設定
 */
const makeConfig = build => ({
    input: [
        path.resolve(process.cwd(), './src/gui/lib/libraries/extensions', build.entryDir, 'index.jsx'),
        path.resolve(process.cwd(), './src/vm/extensions/block', build.blockFile)
    ],
    context: 'window',
    plugins: [
        multi(),
        importImage(),
        commonjs(),
        nodePolyfills(),
        nodeResolve({
            browser: true,
            preferBuiltins: false,
            modulePaths: [path.resolve(process.cwd(), './node_modules')]
        }),
        json(),
        babel({
            babelrc: false,
            exclude: ['node_modules/**'],
            presets: [
                ['@babel/preset-env', {
                    modules: false,
                    targets: {browsers: ['last 3 versions', 'Safari >= 8', 'iOS >= 8']}
                }],
                '@babel/preset-react'
            ],
            babelHelpers: 'runtime',
            plugins: [
                '@babel/plugin-transform-react-jsx',
                ['@babel/plugin-transform-runtime', {regenerator: true, useESModules: true}]
            ]
        })
    ],
    output: {
        file: path.resolve(process.cwd(), './dist', `${build.name}.mjs`),
        format: 'es',
        sourcemap: true
    },
    watch: {
        clearScreen: false,
        chokidar: {usePolling: true},
        buildDelay: 500
    },
    external: []
});

export default BUILDS.map(makeConfig);
