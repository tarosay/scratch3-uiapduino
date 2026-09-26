// scratch3-uiapduino / remap3.js
// Created by tarosay (2026)
//
// Remap3 版の拡張機能。HID 版 (index.js) のクラスを受け継ぎ、版の値だけを差し替える。
//
// ブロックも通信もすべて index.js と uiapduinoProcessor.js のもので、ここには何も書かない。
// 本体は版の値をいつも this.variant から取るので、static get variant() を
// 上書きするだけで Remap3 版になる。値そのものは variantRemap3.js にある。
//
// ⚠ ESM で書くこと。理由は index.js の冒頭と同じ (Xcratch 版の rollup と
//   デスクトップ版の webpack で共有するため)。デスクトップ版の
//   extension-support/extension-manager.js は require('...').default で受ける。
import Scratch3Uiapduino from './index';
import * as remap3Variant from './variantRemap3';

/**
 * UIAPduino Remap3 (Tools → PWM = TIM2 Remap3 のスケッチ用)。
 * PWM を出せるピンが 8 本になる。それ以外は HID 版と同じ。
 */
class Scratch3UiapduinoRemap3 extends Scratch3Uiapduino {
    /**
     * Remap3 版の値。本体の static get variant() を参照。
     * @returns {object} variantRemap3.js の中身
     */
    static get variant () {
        return remap3Variant;
    }
}

// blockClass という名前でも出すこと。Xcratch のローダはこの名前で拡張本体を探す
// (index.js の末尾と同じ)。
export {Scratch3UiapduinoRemap3 as default, Scratch3UiapduinoRemap3 as blockClass};
