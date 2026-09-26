// scratch3-uiapduino / messages.js
// Created by tarosay (2026)
//
// 拡張機能一覧のカードと接続モーダルに出す UIAPduino の訳文。
//
// scratch-gui の `gui.*` の訳文は上流の scratch-l10n パッケージから供給される。
// そちらは Transifex から生成される別リポジトリの成果物で、npm install のたびに
// 上書きされるため、この拡張の ID を書き足すことはできない。
// そこで訳文をここに持ち、src/reducers/locales.js で上流のメッセージへ重ねている。
//
// ここに無いロケールは index.jsx の defaultMessage (英語) が出る。
//
// ブロックパレットの文字列はこのファイルではなく、
// scratch-vm 側の extensions/scratch3_uiapduino/index.js が自前で持っている。
// 翻訳の供給元が別なので、片方だけ直しても両方には反映されない。

export default {
    ja: {
        'gui.extension.uiapduino.name': 'UIAPduino',
        'gui.extension.uiapduino.description': '自分だけのコントローラーを作ってみよう。',
        'gui.extension.uiapduino.connectingMessage': 'UIAPduinoに接続中',
        'gui.extension.uiapduinoRemap3.name': 'UIAPduino Remap3',
        'gui.extension.uiapduinoRemap3.description': 'PWM を 8 本出せる版です。',
        'gui.extension.uiapduinoRemap3.connectingMessage': 'UIAPduinoに接続中'
    },
    'ja-Hira': {
        'gui.extension.uiapduino.name': 'UIAPduino',
        'gui.extension.uiapduino.description': 'じぶんだけのコントローラーをつくってみよう。',
        'gui.extension.uiapduino.connectingMessage': 'UIAPduinoにせつぞくちゅう',
        'gui.extension.uiapduinoRemap3.name': 'UIAPduino Remap3',
        'gui.extension.uiapduinoRemap3.description': 'PWM を 8ほん だせる はんです。',
        'gui.extension.uiapduinoRemap3.connectingMessage': 'UIAPduinoにせつぞくちゅう'
    }
};
