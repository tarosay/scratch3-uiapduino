# scratch3-uiapduino

Scratch 3.0 から **UIAPduino** を USB-HID (WebHID) で操作する拡張機能です。

**使い方は 2 通りあります。ブロックの実装は同じものを共有しています。**

| | 使い方 | 中身 |
|---|---|---|
| **[Xcratch](https://xcratch.github.io/) 版** | 下の URL を「拡張機能を追加 → Extension Loader」に入れる | インストール不要。Chrome か Edge が要る |
| **デスクトップ版** | インストーラを入れる | Scratch Desktop に組み込んだもの |

```
https://tarosay.github.io/scratch3-uiapduino/uiapduino.mjs
```

Xcratch 版の作り方は [`xcratch/README.md`](xcratch/README.md) にあります。

デスクトップ版の構成は [scratch3-tello](https://github.com/tarosay/scratch3-tello) と同じ
**オーバーレイ方式** です。そちらはこのリポジトリ単体では動きません。上流の
scratch-vm / scratch-gui / scratch-desktop を clone した上に、このリポジトリのファイルを
被せてビルドします。

---

## 🔥 まず基板にスケッチを書き込みます

**v0.2.4 から、Arduino IDE は要りません。** パレットの末尾にある
`スケッチ (プロトコル 8) を書き込む` を押すだけです。焼かれるのは
**拡張機能に同梱してあるスケッチ**なので、拡張機能とスケッチの版は必ず一致します。

1. **基板を書き込みモードにする。** 基板のボタンを押しながら USB ケーブルを接続し、
   すぐにボタンを離します
2. **パレットの `スケッチ (プロトコル 8) を書き込む` をクリックする。**
   デバイス選択のダイアログに `32V003` が出るので、それを選びます
3. 進み具合は `書き込みの ようす` に出ます。焼き終わると基板は自動で繋ぎ直ります

**プロトコルが合わないと言われたときも、その画面から直せます。**
パレットが説明に差し替わっているとき、その説明の下に同じ 2 つのブロックが並びます。

**⚠ ブロックを直接クリックしてください。** 緑の旗では焼けません。

**⚠ Chrome か Edge が要ります。**

**⚠ Linux では先に udev ルールの追加が要ります**（「[Linux で使うとき](#-linux-で使うとき)」）。

**⚠ 「UIAPduino への接続が失われました」と出たら、× で閉じてください。**
ケーブルを抜いたときに出るもので、焼き終わって繋がり直しても消えずに残ります。

書き込みブロックの詳しい話は「[スケッチの書き込みについて](#スケッチの書き込みについて)」にあります。

---

## 🐧 Linux で使うとき

**Linux では udev ルールの追加が要ります。** 無いとブラウザがデバイスを開けず、
デバイス選択のダイアログに基板が出てこなかったり、選んでも繋がらなかったりします。
Windows と macOS では要りません。

```bash
sudo nano /etc/udev/rules.d/99-minichlink-uiap-hid.rules
```

エディタで次の 4 行（コメントを除く）を書きます。

```
# tarosay/scratch3-uiapduino
# 通常のスケッチ
SUBSYSTEM=="usb", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="d004", GROUP="plugdev", MODE="0660"
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="d004", GROUP="plugdev", MODE="0660"
# 書き込みモード (rv003usb ブートローダ)
SUBSYSTEM=="usb", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="b803", GROUP="plugdev", MODE="0660"
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="b803", GROUP="plugdev", MODE="0660"
```

書けたら読み込ませます。

```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

**リロードのあとブラウザを更新してください。** 既に開いているページには効きません。

**⚠ VID:PID は 2 組あります。** 基板は通常のスケッチで動いているとき `1209:d004` を
名乗り、書き込みモードに入ると `d004` は消えて `1209:b803`（rv003usb ブートローダ）が
現れます。**別のデバイスです。** `d004` だけを書くと、ブロックは動くのに
「スケッチを書き込む」だけが失敗します。

**⚠ `plugdev` グループに入っている必要があります。** Ubuntu などでは普通そうなって
いますが、`id -nG | grep plugdev` で何も出なければ、
`sudo usermod -aG plugdev $USER` を実行して一度ログインし直してください。

公式ドキュメントの
[udev ファイルの追加方法](https://www.uiap.jp/uiapduino/pro-micro/ch32v003/v1dot4#linux)
とは**別のファイル名にしてあります。** 共通のファイルに追記していくと煩雑になるためです。

動作を確認した環境（[Issue #1](https://github.com/tarosay/scratch3-uiapduino/issues/1)、
YuukiUmeta-UIAP さんの報告）:

```
Ubuntu 24.04 (Linux 7.0.0-28-generic)
Google Chrome 151.0.7922.137 (x86_64)
```

---

## 🚧 現在の状態

**Scratch から実機の LED を点灯するところまで確認済みです。**

| 項目 | 状態 |
|---|---|
| ブロック定義 | 汎用 Arduino 相当。**実機確認済み** |
| マウスのブロック | **全ブロック実機確認済み**（移動・クリック・ダブルクリック・ドラッグ・囲みブロック・ホイール） |
| キーボードのブロック | **全ブロック実機確認済み**（タイプ・キー・`押しながら〔 〕`） |
| サーボのブロック | バージョン 6 で追加。**SG-90 で実機確認済み**（可動域を実測して duty 上限を 29 に決めた） |
| 距離計のブロック | バージョン 6 で追加。**HC-SR04 で実機確認済み** |
| NeoPixel のブロック | バージョン 8 で追加。**WS2812B 12 連リングで実機確認済み**（2026-08-13）。色の並びの補正は 6 通りとも実機確認済み（2026-08-31） |
| 書き込みのブロック | v0.2.4 で追加。**Xcratch 版で実機確認済み**（2026-08-14）。プロトコル 5 の基板を、パレットのブロックだけで焼き直せた |
| WebHID 通信層 | **実機で確認済み**（接続・切断・再接続・入出力） |
| 接続フロー | ステータスボタンと接続モーダルに対応。**実機確認済み** |
| GUI の日本語 | 拡張カードと接続モーダルを `ja` / `ja-Hira` で表示。実機確認済み |
| コマンドプロトコル | uiap-hid-web と同じ `0x52` 方式に統一済み |
| デバイス側スケッチ | `sketches/ScratchUiapduino/` にあり・実機で全コマンド確認済み |
| バージョン照合 | 実機確認済み |
| ビルド | Windows で通過。インストーラ生成まで確認済み |
| アイコン | 差し替え済み（カード 600x372 / 小アイコン 80x80） |
| ビルドスクリプト | scratch3-tello の実績あるものを流用 |
| **Xcratch 版** | **全ブロック実機確認済み**（読み込み・日本語・接続モーダル・接続・ピン・キーボード・マウス・切断・再接続） |
| Xcratch 版の非対応ブラウザ | WebHID の無いブラウザでは説明 3 行だけを出す。**Firefox で確認済み** |
| Xcratch 版の抜線 | 押しっぱなしの解除はブラウザではできないが、**実機では問題にならなかった** |
| プロジェクトの相互運用 | Xcratch で保存した `.sb3` をデスクトップ版で開けることを確認済み |
| スケッチの版の照合 | PING の上位バイトで名乗る。版は HID 版 (0) と Remap3 版 (1)。**Remap3 版は Xcratch と実機で 8 本すべての PWM 出力を確認済み。デスクトップ版の Remap3 版も実機で確認済み** |

**ピン操作のブロックは実機で確認済みです。** そのほか以下も確認しています。

- 「つなぐ」がユーザ操作なしで `true` を返す
- USB を抜くと「つながっている」が false になり、挿し直して「つなぐ」で復帰する
- デバイスが無い状態で「つなぐ」を繰り返しても落ちず `false` を返す
- 拡張機能一覧で UIAPduino を選ぶと接続モーダルが自動で開く
- モーダルは機器一覧を出さず、そのまま接続済み画面へ進む
- 「つながっている」はバージョン照合の完了後だけ true になる
- USB を抜くとステータスボタンが「!」に戻り、接続が切れた旨の警告が出る
- 接続に失敗しても Scratch Link / Bluetooth の案内は表示されない
- 接続バッジが Bluetooth ではなく USB マークになる
- 拡張カードと接続モーダルが日本語・ひらがな・英語で切り替わる
- `A0 の値`〜`A3 の値` はチェックを入れるとステージに 4 つ別々に並び、
  緑の旗を押していなくても値が更新される

**マウスのブロックも実機で確認済みです。**

- 各ブロックが実際に PC のカーソルを動かす／クリックする
- 1500px の移動が切り捨てられずに最後まで動く（分割数を移動量から決める実装が効いている）
- ダブルクリックが 1 回のクリックと誤認されない
- `ドラッグしながら〔 〕` の中に「動かす」を並べて、折れ線や曲線が 1 本のストロークになる
- 停止ボタンでボタンの押しっぱなしが解除される（囲みブロックの中身の途中で押した場合も）
- 押したまま 5 秒放置するとデバイス側の見張りが離す
- USB を `Keyboard+Mouse+WebHID` に変えても接続フローがこれまでどおり動く
- 押しっぱなしのまま USB を抜くと、**Scratch 自身の**押しっぱなしは自動で外れる
- `Tools → USB` が `Keyboard+Mouse+WebHID` でないと、スケッチがコンパイル時に止まる

**既知の制限：押しっぱなしのまま USB を抜いたとき、操作していた他アプリの
ドラッグは残ります。** どこかを 1 回クリックすれば消えます（その 1 回は消費されます）。
自動で直せない理由と、試して捨てた 3 つの案は
「[🔌 「ケーブルを抜く」を最終手段として成立させる](#-ケーブルを抜くを最終手段として成立させる)」に書いてあります。

なお `押したままにする` のブロックを廃止したので、**この状態を作れるのは
`ドラッグしながら〔 〕` の中身が動いている間だけ**になりました。

**キーボードのブロックも実機で確認済みです。**

- `キーボードで [Hello UIAPduino] と打つ` が**大文字も欠けずに**メモ帳に入力される
- 記号が打てる（`!@#$%^&*()_+{}|:"~<>?` と `` -=[]\;'`,./ ``）
- **29 文字を超える文字列**が、途切れず・重複せず・順番どおりに入る（29 / 30 / 31 の境界）
- `[Enter▼] キーを押して離す` で改行される。矢印・Backspace・Delete も効く
- `キーボードの [Shift▼] を押しながら〔 キーボードで [Hello] と打つ 〕` で `hELLO` になる
- `キーボードの [Ctrl▼] を押しながら〔 キーボードで [c] と打つ 〕` でコピー、`[v]` で貼り付けができる
- **囲みを抜けた後、修飾キーが残っていない**（続けてタイプしても化けない）
- 入れ子（`Ctrl` の中に `Shift`）で `Ctrl + Shift + …` になる
- 囲みの中身が動いている最中に停止ボタンを押すと、修飾キーが離れる
- 囲みの中で `このスクリプトを止める` を使っても、5 秒後に離れる
- 日本語や絵文字を渡すと、無言で化けず開発者コンソールに警告が出る

実機に載せる前の机上の検証（ブロック定義 106 項目と、`keyTap()` が出す HID レポート列の
再現）は `docs/scratch3-uiapduino-keyboard-blocks-spec.md` に書いてあります。

---

## 📐 構成

このリポジトリのファイルは 2 種類に分かれます。**どちらなのかで扱いが変わります。**

### 🆕 新規ファイル（すべて tarosay のオリジナル）

上流には存在しないファイルです。オーバーレイ時に新規追加されます。

| ファイル | 内容 |
|---|---|
| `scratch-vm/src/extensions/scratch3_uiapduino/index.js` | ブロック定義。通信方式を一切知らない |
| `scratch-vm/src/extensions/scratch3_uiapduino/uiapduinoProcessor.js` | WebHID 通信 + コマンドキュー |
| `scratch-vm/src/extensions/scratch3_uiapduino/rv003usbFlasher.js` | 基板への書き込み処理。**第三者のコード (MIT)。** 下記 License を参照 |
| `scratch-vm/src/extensions/scratch3_uiapduino/remap3.js` | Remap3 版の入口。`index.js` のクラスを受け継ぎ、版の値だけを差し替える |
| `scratch-vm/src/extensions/scratch3_uiapduino/variant.js` | 版ごとに違う値（HID 版）。ID・URL・名前・色・PWM のピン・同梱スケッチ |
| `scratch-vm/src/extensions/scratch3_uiapduino/variantRemap3.js` | 同じく Remap3 版 |
| `scratch-vm/src/extensions/scratch3_uiapduino/sketchBin.js` | 同梱スケッチ (base64)。**自動生成。手で書かない** |
| `scratch-vm/src/extensions/scratch3_uiapduino/sketchBinRemap3.js` | 同じく Remap3 版。**自動生成。手で書かない** |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino.png` | 拡張機能ライブラリのカード画像 (600x372) |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-small.png` | 小アイコン (80x80) |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-remap3-menu.png` | Remap3 版のカテゴリ一覧の絵 (80x80)。`variantRemap3.js` に base64 で埋め込んである |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-remap3-small.png` | Remap3 版のカードの小さな絵 (80x80、背景透明。Xcratch 版とデスクトップ版の両方)。`uiapduino-small.png` の線を `#3F51B5` にしたもの |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-remap3.png` | Remap3 版のカードの絵 (600x372。Xcratch 版とデスクトップ版の両方)。`uiapduino.png` の緑を `#3F51B5` の青に置き換えたもの |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/SketchWrite.png` | 書き込みブロックのアイコン (80x80) |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/uiapduino-illustration.png` | 接続モーダル用の画像 (266x165) |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/usb-hid-white.svg` | 接続バッジの USB マーク (20x20) |
| `scratch-gui/src/lib/libraries/extensions/uiapduino/messages.js` | GUI 側の日本語訳（`ja` / `ja-Hira`） |
| `sketches/ScratchUiapduino/ScratchUiapduino.ino` | デバイス側スケッチ |
| `sketches/ScratchUiapduino/sketch.yaml` | ボードと Tools メニューの設定 |
| `sketches/ScratchUiapduino.ino.bin` | 上をビルドしたもの（HID 版）。`sketchBin.js` の元 |
| `sketches/ScratchUiapduino-remap3.ino.bin` | 同じ `.ino` を Tools → PWM = TIM2 Remap3 でビルドしたもの。`sketchBinRemap3.js` の元 |
| `build-scratch3-uiapduino.ps1` | ビルドスクリプト |
| `xcratch/` | Xcratch 版のビルド環境（詳細は [`xcratch/README.md`](xcratch/README.md)） |
| `docs/uiapduino.mjs` | **配っている Xcratch 版のモジュール**。GitHub Pages が `/docs` を公開している |
| `README.md` / `LICENSE` | このファイルとライセンス |

`xcratch/` の下にブロックの実装はありません。ビルドのたびに上のファイルを複製して
使っています。**直すのは常に `scratch-vm/src/extensions/scratch3_uiapduino/` の方です。**

HID 版と Remap3 版は同じ `index.js` / `uiapduinoProcessor.js` から作ります。
版ごとに違う値は `variant.js` / `variantRemap3.js` にしか書きません。
本体は版の値をいつも `this.variant` から取り、Remap3 版の入口 `remap3.js` は
`index.js` のクラスを受け継いでその値だけを差し替えます。
デスクトップ版は 1 つのアプリに両方を登録し、ライブラリに 2 枚のカードが並びます。
Xcratch 版は版ごとに 1 枚ずつ `.mjs` を作ります。

`index.js` と `uiapduinoProcessor.js` の分離は Tello 拡張と同じで、
ブロック層は通信方式を一切知りません。プロトコルを変える場合も
`uiapduinoProcessor.js` だけを直せば済みます。

`ScratchUiapduino.ino` はデバイス側で動くもので、**Scratch のビルドには含まれません。**
ただし、これをビルドした `.bin` は `sketchBin.js` として**拡張機能に同梱**してあり、
[書き込みブロック](#書き込み方法)がそれを基板へ流し込みます。

### ✏️ 上流ファイルへのパッチ（Scratch Foundation / MIT のコードを改変）

**上流のファイルを丸ごと上書きします。** 上流が更新されたら追従が必要です。

| ファイル | 変更点 |
|---|---|
| `scratch-vm/src/extension-support/extension-manager.js` | `builtinExtensions` に `uiapduino` を 1 行追加 |
| `scratch-gui/src/lib/libraries/extensions/index.jsx` | 拡張機能ライブラリの配列に UIAPduino の項目を追加 |
| `scratch-gui/src/reducers/locales.js` | `scratch-l10n` のメッセージに UIAPduino の訳文を重ねる |
| `scratch-gui/src/containers/connection-modal.jsx` | 接続バッジの絵を下位コンポーネントへ渡す |
| `scratch-gui/src/components/connection-modal/connected-step.jsx` | 接続バッジを差し替え可能にする |
| `scratch-gui/src/components/connection-modal/connecting-step.jsx` | 同上 |
| `scratch-desktop/src/main/index.js` | WebHID の許可設定と、USB 抜線時の押しっぱなし解除を追加（後述） |

上流のどのバージョンに対するパッチかは `build-scratch3-uiapduino.ps1` の
clone 時のタグで固定されています。

| 上流 | タグ |
|---|---|
| scratch-vm | `0.2.0-prerelease.20220222132735` |
| scratch-gui | `scratch-desktop-v3.29.0` |
| scratch-desktop | `v3.29.1` |

---

## 🔌 WebHID について

### デバイス

| 項目 | 値 |
|---|---|
| vendorId | `0x1209` |
| productId | `0xD004` |
| usagePage | `0xFF00`（ベンダー定義） |
| usage | `0x01` |

Usage Page がベンダー定義であることが重要です。キーボード／マウスの Usage Page を
使うと、Windows がアプリからのアクセスをブロックします。

### レポート

| 方向 | 種別 | サイズ |
|---|---|---|
| Scratch → UIAPduino | Feature Report (EP0) | 32 バイト |
| UIAPduino → Scratch | Input Report (EP1 IN) | 8 バイト |

Input Report のエンドポイントは USB 設定によって変わります
（`WebHID Only` は EP1、`Keyboard+Mouse+WebHID` は EP3）。
ホスト側からは見えないので Scratch 側の実装には影響しません。

Feature Report は `arduino_core_ch32` v1.1.5 以降で 16 → 32 バイトに拡張されました。
実サイズは接続時に HID ディスクリプタから自動取得します。

### scratch-desktop 側のパッチが必須

Electron は既定で HID デバイスをレンダラに一切見せません。
`scratch-desktop/src/main/index.js` に以下を追加してあります。

- `setPermissionCheckHandler` … `'hid'` を許可。**実際に効いているのはこれ**
- `setDevicePermissionHandler` … VID/PID が一致するデバイスだけ許可
- `'select-hid-device'` … Electron はネイティブのデバイス選択ダイアログを出さないため、
  ここで自動選択しないと `requestDevice()` は必ず空で返る

Electron 15.3.1 にこれらの API が存在することは確認済みです。

### ⚠ ハンドラは 1 つの session に一度だけ登録すること

`createWindow` は **main / about / privacy の 3 つのウィンドウで呼ばれ、
いずれも既定 session を共有します。**

`setXxxHandler` 系は上書きなので何度呼んでも無害ですが、
`'select-hid-device'` は `on()` なのでリスナが積み上がります。
3 つ登録された状態でイベントが起きると `callback` が 3 回呼ばれ、

```
A JavaScript error occurred in the main process
TypeError: One-time callback was called more than once
```

で main プロセスが落ちます。`setupWebHid()` が `WeakSet` で二重登録を防いでいます。

**この不具合はデバイスが繋がっていないときにしか出ません。**
`connect()` は先に `getDevices()` を試すので、デバイスがあれば
`requestDevice()` に到達せず `'select-hid-device'` も発火しないためです。

デバイスが見つからないときは `callback()` を**引数なし**で呼びます。
Electron のドキュメントどおりで、これがリクエストのキャンセルになります
（`deviceId` の型は `String` なので `callback(null)` は仕様外）。

### ✅ ユーザ操作なしの接続について（検証済み）

`navigator.hid.requestDevice()` は Chromium 側で**ユーザ操作（実際のクリック）**を要求します。
Scratch のブロック実行は VM のループから呼ばれるためユーザ操作とはみなされないので、
「つなぐ」ブロックから `requestDevice()` を呼んでも失敗するのではないか、というのが
当初いちばん危惧していた点でした。

**実機で確認した結果、問題ありませんでした。**
`uiapduinoProcessor.connect()` は先に `getDevices()` を試します。
`setDevicePermissionHandler` が true を返していれば、Electron は
`requestDevice()` を一度も呼んでいないデバイスも `getDevices()` で返すため、
ユーザ操作なしに接続できます。「つなぐ」ブロックは `true` を返します。

したがって「つなぐ」ブロックだけでも接続できます。後から追加した接続モーダルは、
このブロックを置き換えるものではなく、接続経路を増やすものです（次項）。

なお uiap-hid-web は全ページ `requestDevice()` のみで `getDevices()` を使っていないため、
この経路はサイト側では一度も踏まれていません。この拡張が初めて通した経路です。

### 🔘 ステータスボタンと接続モーダル

Scratch 標準のハードウェア拡張と同じ接続フローに対応しています。
`showStatusButton` と `runtime.registerPeripheralExtension()` で
Scratch VM の Peripheral Extension API に繋いであります。

- 拡張機能一覧で UIAPduino を選ぶと、接続モーダルが自動的に開いて検索が始まります
- ブロックパレットのカテゴリ見出しに接続状態ボタンが出ます（未接続なら「!」）
- 「!」をクリックすると同じモーダルが開き、接続をやり直せます
- 接続済みのボタンからは状態の確認と切断ができます

**機器の一覧は出しません。** Bluetooth 機器と違い UIAPduino は 1 台だけを前提とし、
Electron 側が該当デバイスを自動選択するため、一覧に 1 台だけ出して
もう一度選ばせる操作を省いています。検索画面から直接接続済み画面へ進みます。

接続に失敗したときは「デバイスが見つかりません」になります。失敗の理由
（デバイスなし・open 失敗・PING 無応答・バージョン不一致など）は
開発者コンソールに出ます。Scratch GUI 3.29 の接続エラー画面は Scratch Link 用の
文言が固定で入っており、WebHID には誤案内になるため使っていません。

既存の「つなぐ」ブロックはそのまま残してあります。opcode も変えていないので
既存のプロジェクトはそのまま読めます。ブロックで接続した場合も
ステータスボタンは接続済みに変わります。

### 🌐 GUI 側の日本語について

日本語は **2 か所に分かれています。**

| 表示場所 | 訳文のありか |
|---|---|
| ブロックパレットの文字列 | `scratch-vm/.../scratch3_uiapduino/index.js` の `message` 定数 |
| 拡張機能一覧のカード・接続モーダル | `scratch-gui/src/lib/libraries/extensions/uiapduino/messages.js` |

後者がややこしいところです。`index.jsx` にあるのは `FormattedMessage` の `id` だけで、
`gui.*` の訳文は上流の **`scratch-l10n` パッケージ**から供給されます。
これは Transifex から生成される別リポジトリの成果物で、`npm install` のたびに
上書きされるため、`gui.extension.uiapduino.*` を直接書き足すことはできません。
実際、固定版の `editor-msgs.js` に日本語は 758 件ありますが、
UIAPduino の ID は 1 件もありません。

そこで訳文をこのリポジトリ側に持ち、`src/reducers/locales.js` で上流のメッセージに
重ねています。`ja` と `ja-Hira` を用意していて、それ以外のロケールでは
`index.jsx` の `defaultMessage`（英語）が出ます。
`defaultMessage` に日本語を書かないのは、未翻訳のロケール全部に日本語が出てしまうためです。

USB を抜いたときの警告文は上流に訳があるので、この対応なしで日本語になります。

### 🖼 接続モーダルの画像サイズ

**接続モーダルの画像は、あらかじめ小さく作っておく必要があります。**

上流の `connection-modal.css` は画像のサイズ指定をコメントアウトしているため、
画像は**原寸で表示されます**。置き場所の `.activityArea` は高さ 165px、
モーダルの幅は 480px しかありません。

一覧用の `uiapduino.png` (600x372) をそのまま渡すと枠を大きくはみ出し、
「接続しました」の文言やボタンの上に重なります。透過画像だと下の要素が
透けて見えるので気づきにくいのですが、はみ出し自体は透過の有無に関係なく起きています。

そのため接続モーダルには専用の `uiapduino-illustration.png` (266x165) を使っています。
**高さは `.activityArea` と同じ 165px ちょうど**にしてください。

内側の余白 (padding 0.5rem) を引いた 149px で作ると、上下に 8px ずつ背景色の帯が出ます。
165px にすると余白の分まで覆うので帯が消えます
（`.activityArea` は `overflow` を指定しておらず、flex の中央寄せで上下へ均等にはみ出すため）。

全幅 (480x165) にすると左右の帯も消えますが、元絵の縦を 44% 切り落とすことになり、
さらに接続バッジが `left: -15px` で絵の左外に出るため、
`.modal-content` の `overflow: hidden` で見切れます。左右の帯は残す方が無難です。

上流の画像も micro:bit が 116x95、EV3 が 92x128、WeDo 2.0 が 108x48 と、
いずれも枠に収まる大きさで用意されています。

### 🔵 接続バッジを Bluetooth から USB に変えている

接続中・接続済みの画面では、機器の絵の右上に小さなバッジが重なります。
上流の `connecting-step.jsx` と `connected-step.jsx` は
**Bluetooth マークを無条件で描画**しており、拡張機能ごとに切り替える仕組みがありません。
UIAPduino は WebHID なので、そのままだと嘘の表示になります。

そこで extension data に `connectionBadgeIconURL` を追加し、
指定があればそれを、無ければ従来どおり Bluetooth マークを出すようにしています。

**CSS で一律に消す方法は採っていません。** `display: none` で消せば 1 ファイルで済みますが、
micro:bit・EV3・WeDo 2.0・Go Direct のモーダルからもマークが消えます。
それらは Scratch Link を使う本物の Bluetooth 機器なので、表示を壊してはいけません。

バッジの絵は上流の `bluetooth-white.svg` に合わせて **20x20 の白 1 色**です。
`.bluetooth-connected-icon` は padding 5px の丸の中に置かれるため、この寸法から外れると収まりません。
文字入りの図案は 20px では読めないので使えません。

### USB を抜いたとき

**WebHID では物理的に切断されても `HIDDevice.opened` は自動的に false になりません。**
`navigator.hid` の `disconnect` イベントを購読しないと、
「つながっている」ブロックが true を返し続けます。
さらに再接続時 Chromium は**新しい `HIDDevice` オブジェクト**を作るため、
古いハンドルを握ったままだと挿し直しても送信が無視されます。

`uiapduinoProcessor` は `disconnect` を購読し、自分が使っているデバイスなら
接続状態を捨てて実行待ちのコマンドをすべて reject します。
そのうえで Scratch へ切断と接続喪失の両方を通知するので、
ステータスボタンが「!」に戻り、接続が切れた旨の警告も表示されます。

**挿し直したら「!」をクリックするか、「つなぐ」ブロックをもう一度実行してください。**
自動再接続はしません。

### ⚠ 権限ハンドラの注意点

Electron 15 では `'hid'` は `setPermissionRequestHandler` の許可種別に**含まれません**。
`setPermissionCheckHandler` 側の種別です。

さらに `setPermissionCheckHandler` を設定すると、**すべてのパーミッションチェックの
既定動作を奪います。** Electron はハンドラ未設定のとき `CheckPermissionWithDetails` で
`true` を返すため、`'hid'` 以外で `false` を返すとカメラ・マイクなど既存機能が壊れます。
`scratch-desktop/src/main/index.js` の `handlePermissionCheck` は
`'hid'` 以外で `true` を返して既定に合わせています。

---

## 📡 コマンドプロトコル

Tello の「コマンドを送る → 応答を待つ → 次を送る」と同じ契約です。

ワイヤフォーマットは **独自定義ではなく、[uiap-hid-web](https://github.com/tarosay/uiap-hid-web) の
`uiapruby.html` が実機に対して使っているものと同一**です。デバイス側ライブラリ
（`Hid.h`）が既に持っている契約なので、既存スケッチ資産と同じ経路で動きます。

### Scratch → UIAPduino（Feature Report / 32 バイト）

| バイト | 内容 |
|---|---|
| 0 | コマンド ID |
| 1.. | パラメータ |

### UIAPduino → Scratch（Input Report / 8 バイト）

先頭バイトがマーカーです。コマンド応答のほかに、コンソール出力とログが非同期に届きます。

| マーカー | 用途 |
|---|---|
| `0x52` | コマンド応答 |
| `0x50` | コンソール出力（`hid.Print` / `hid.Println`） |
| `0x44` | デバイスログ |

コマンド応答（`0x52`）の中身:

| バイト | 内容 |
|---|---|
| 0 | `0x52` |
| 1 | ステータス（`0`=OK / `1`=ERR / `2`=DATA / `3`=END） |
| 2 | ペイロード長（0–5） |
| 3–7 | ペイロード |

戻り値のないコマンドは `OK` だけを返します。戻り値のあるコマンドは
`DATA` を必要な回数繰り返してから `END` で終端します（`stream_bytes()` と同じ）。
数値はリトルエンディアンです。

### コマンド ID

`0x01` は `Hid.h` の接続通知で予約済み、`0x01`–`0x11` は uiapruby の SD ファイル操作と
RUN/STOP が使用中のため、Scratch 拡張は衝突しない `0x20` 以降を使います。
これにより、将来 1 つのスケッチに UIAPruby VM と Scratch 対応を同居させられます。

| ID | 名前 | パラメータ | 応答 |
|---|---|---|---|
| `0x01` | （接続通知・予約） | なし | なし |
| `0x20` | PING | なし | DATA(2) → END（下位=プロトコルのバージョン / 上位=スケッチの版） |
| `0x21` | PIN_MODE | pin, mode | OK |
| `0x22` | DIGITAL_WRITE | pin, value | OK |
| `0x23` | DIGITAL_READ | pin | DATA(1) → END |
| `0x24` | ANALOG_WRITE | pin, duty(0-255), 周波数Hz uint16LE | OK |
| `0x25` | ANALOG_READ | pin | DATA(2) → END |
| `0x26` | SERVO | pin, duty(0-255), 周波数Hz uint16LE | OK |
| `0x27` | DISTANCE | Trig, Echo | DATA(2) → END（往復時間 µs / 測定不能は 0） |
| `0x2F` | PANIC | なし | OK |
| `0x30` | KEY_TEXT | flags, ASCII（0 終端） | OK |
| `0x31` | KEY_WRITE | キーコード | OK |
| `0x32` | KEY_PRESS | キーコード | OK |
| `0x33` | KEY_RELEASE | キーコード | OK |
| `0x34` | KEY_RELEASE_ALL | なし | OK |
| `0x40` | MOUSE_MOVE | dx int16LE, dy int16LE | OK |
| `0x41` | MOUSE_WHEEL | 符号付きの回数 | OK |
| `0x42` | MOUSE_CLICK | ボタン | OK |
| `0x43` | MOUSE_PRESS | ボタン | OK |
| `0x45` | MOUSE_RELEASE | ボタン | OK |
| `0x46` | MOUSE_RELEASE_ALL | なし | OK |
| `0x47` | MOUSE_DBLCLICK | ボタン | OK |
| `0x48` | MOUSE_DRAG | dx int16LE, dy int16LE, ボタン | OK |
| `0x60` | NEO_BEGIN | LED の個数(1-64) | OK |
| `0x61` | NEO_SET | 開始番号, 個数(1-9), RGB × 個数 | OK |
| `0x62` | NEO_FILL | 開始番号, 個数(0=最後まで), R, G, B | OK |
| `0x63` | NEO_SHOW | なし | OK |
| `0x64` | NEO_BRIGHTNESS | 0-255 | OK |

`0x44` は空けてあります。デバイス → Scratch のログマーカー（`0x44`）と同じ値で、
方向が逆なので衝突はしませんが、`hid-console.html` でログを追うときに紛らわしいためです。

ボタンの値はデバイス側 `Mouse.h` と同じ `1`=左 / `2`=右 / `4`=中です。

`KEY_PRESS`（`0x32`）/ `KEY_RELEASE`（`0x33`）は **ブロックとして露出していません。**
`キーボードの [Ctrl▼] を押しながら〔 〕` の囲みブロックが中身の前後で使います。
押しっぱなしをブロックの内側に閉じ込めるためで、マウスの `MOUSE_PRESS` と同じ考え方です。
`KEY_RELEASE_ALL`（`0x34`）は `PANIC` の経路で使います。

NeoPixel の `0x50` 台を避けたのは、デバイス → Scratch のマーカー
（`0x50`=コンソール / `0x52`=応答 / `0x53`=READY / `0x54`=シリアル受信）と
番号が紛らわしいためです。向きが違うので衝突はしませんが、
`hid-console.html` で生バイトを追うときに目で混ざります。

**デバイスは色を作りません。** 虹・回転・減衰・HSV の計算はすべて Scratch 側（JS）にあり、
`NEO_SET` を通るのは出来上がった RGB だけです。1 コマンドの往復に 12〜15ms かかるので、
LED を 1 個ずつ送ると 12 連のリングで 180ms かかってアニメーションになりません。
Scratch 側が鏡のバッファを持ち、`NEO_SHOW` でまとめて出す形にしてあります。

**LED の個数を持っているのは Scratch 側です。** デバイスは `NEO_BEGIN` で言われた数を
覚え、その数ぶんだけ波形を出します。だから LED を増やしても基板を焼き直す必要はなく、
`始める` ブロックの数字を変えるだけで済みます。

**⚠ 個数は「多めに渡しても害がない」値ではありません。**
デバイスは `show()` の間だけ割り込みを止めます（`NEOPIXELMIN_ATOMIC`）。
止まる時間は LED 1 個あたり 32µs で、12 個なら 0.38ms ですが、
64 個だと 2.05ms 止まり、その間 USB がホストの問い合わせに応えられません。

割り込みを止めているのは、**止めないと実機で LED が不規則に光るためです。**
WS2812 は途中で 50µs 以上止まると、そこで 1 フレームが確定したと見なして
次のバイトから別のフレームとして解釈し直します。UIAPduino の USB は
ソフトウェア実装（rv003usb）なので、その割り込みは 50µs を超えます。
しかも USB 設定が `Keyboard+Mouse+WebHID` で、ホストは 3 つのインタフェースを
常時ポーリングしています。詳細は
[NeoPixel ブロック 実装仕様](docs/scratch3-uiapduino-neopixel-blocks-spec.md)。

`0x35` は空けてあります。「修飾キーと組み合わせて押す」を 1 コマンドで行う
`KEY_SHORTCUT` を置いていましたが、消しました。

**キーボードに「ショートカットキー」というキーは存在しません。**
あるのは「キーを押す」と「修飾キーを押したままにする」の 2 つだけで、
その組み合わせを表すのが `キーボードの [Ctrl▼] を押しながら〔 〕` の囲みブロックです。
専用のコマンドを別に持つと、同じことを 2 通りで表せる状態になります。

### ⚠ `KEY_TEXT` / `KEY_WRITE` は `Keyboard.write()` を使ってはいけない

**バージョン 4 で変えた点です。** `arduino_core_ch32` の `Keyboard.write()` は

```cpp
_modifier = modBit;  memset(_keys, 0, 6);  ...  releaseAll();
```

とレポート全体を組み立て直すため、`KEY_PRESS` で押したままにしてある `Ctrl` が
**消えたうえに、最後の `releaseAll()` で全部離れます。** `Keyboard.print()` は
内部で `write()` を呼ぶので同じです。

そのままだと `キーボードの [Ctrl] を押しながら〔 キーボードで [c] と打つ 〕` が**無言で修飾キー無しになります。**
そこでスケッチ側に `keyTap()` を置き、`press()` / `release()` で 1 文字ずつ送るようにしました。
これなら外側で押している修飾キーがそのまま残ります。

### ⚠ ただし `press()` に大文字を渡してもいけない

**バージョン 4 の不具合です。バージョン 5 で直しました。**

```cpp
size_t KeyboardClass::press(uint8_t key) {
    if (!_toHID(key, &hid, &modBit)) return 0;
    if (modBit) {
        _modifier |= modBit;
        _sendReport();
        return 1;              // ← ここで返る。hid が _keys[] に入らない
    }
    for (int i = 0; i < 6; i++) { ... }
}
```

`'H'` は `_toHID()` が **`Shift` ビットとキーコードの両方**を返しますが、
`press()` は `modBit` があるとそこで返ってしまい、**キーを押しません。**
`Shift` を押しただけで終わるので、`Hello` とタイプすると `ello` になります。

`write()` は `_modifier` と `_keys[0]` の両方を組み立てるので問題になりませんでした。
`press()` へ切り替えたときにこの違いを踏んでいます。

対処として `needsShift()` を置き、**文字を「刻印どおりに押せるキー」と
「`Shift` が要るか」に分解**してから、`Shift` は `keyTap()` が自分で押します。
実際のキーボードに `H` というキーは無く、あるのは `h` のキーと `Shift` である、
という当たり前の形に戻したことになります。

接続時には `uiapduinoProcessor.connect()` が接続通知（`0x01`）を送ります。
デバイス側が `WaitAvailable()` で待っている場合、これが無いと起動しません。

### バージョン照合

**スケッチは基板に焼かれたまま残るので、Scratch だけ更新される状況が起こります。**
噛み合わないコマンドを送ると「ブロックが無言で何もしない」という
一番わかりにくい壊れ方をするため、接続時に照合します。

```
接続 → 接続通知(0x01) → PING(0x20) → バージョン照合 → 成否
```

デバイスは PING に `DATA(2)` → `END` を返します。リトルエンディアンで、
**下位バイトがプロトコルのバージョン、上位バイトがスケッチの版**です。
どちらか一方でも噛み合わなければ**接続を拒否**し、「つなぐ」ブロックは `false` を返します。

| バージョン | 内容 |
|---|---|
| 1 | ピン操作のみ。USB は `WebHID Only` |
| 2 | キーボード / マウス / 非常停止を追加。USB が `Keyboard+Mouse+WebHID` になった |
| 3 | ダブルクリックとドラッグを追加 |
| 4 | `KEY_TEXT` / `KEY_WRITE` が押しっぱなしの修飾キーを壊さなくなった（囲みブロックのため） |
| 5 | 大文字と記号が打てるようになった。押しっぱなしの `Shift` は大文字小文字を反転させる |
| 6 | サーボと距離計を追加。`ANALOG_WRITE` と `SERVO` が周波数を伴うようになった（`[3..4]` に Hz） |
| 7 | シリアル通信を追加。受信があると頼まれなくても `0x54` を送るようになった。`begin` 後は D15 / D16（= A5 / A6）が Tx / Rx になり、ピン操作から外れる |
| 8 | NeoPixel を追加（`0x60`–`0x64`）。`begin` 後は D8（SPI1 MOSI）が DIN になり、ピン操作から外れる |

#### ⚠ 上げるのは「公開済みのとき」だけ

**条件は「プロトコルを変えたとき」ではありません。「今の番号が公開済みのとき」です。**

この番号が守る相手は**誰かの手元にある基板**です。まだ配っていない番号には、
守るべき基板が存在しません。開発中に上げても、噛み合わない相手が居ません。

| 今の番号の状態 | どうするか |
|---|---|
| タグ付き / `docs/` 公開済み / 基板を配った | **上げる** |
| どれでもない | **据え置き。**中身だけ作り直して焼き直す |

開発中に焼き忘れれば噛み合わない動きをしますが、それは自分で焼けば済みます。
公開番号を消費してまで守るものではありません。

実際、**公開されたのは 1 の次が 5 でした。**

| タグ | 日付 | `PROTOCOL_VERSION` |
|---|---|---|
| v0.1.0 | 2026-08-05 | 1 |
| v0.1.1 | 2026-08-06 | 1 |
| v0.2.0 | 2026-08-07 | 5 |
| v0.2.1 | 2026-08-09 | 6 |
| v0.2.2 | 2026-08-11 | 7 |
| v0.2.3 | 2026-08-13 | 8 |
| v0.2.4 | 2026-08-14 | 8 ← **据え置き。焼き直し不要** |

2 と 4 はコミットにすら残っていません。手元の検証のたびに機械的に上げたためで、
公開番号を無駄に消費していました（2026-08-08 に指摘を受けて方針を変更）。

| 状況 | 判別 | 開発者コンソールの表示 |
|---|---|---|
| スケッチ未書き込み / 別のスケッチ | PING が無応答 | デバイスが応答しません |
| 旧世代スケッチ | PING に `RSP_OK` だけ（値 0） | スケッチが古すぎます |
| **別の版のスケッチ** | 上位バイトが違う | この基板には〜のスケッチが焼かれています |
| バージョン不一致 | 下位バイトが違う | デバイス=N / この拡張機能=M |

旧世代の判別は自然にできます。以前 PING は `RSP_OK` を返していたので、
**値なし = 0 が「バージョンを持たない世代」を意味する**ためです。

### スケッチの版

**UIAPduino は Flash が 16KB しかなく、機能を全部は載せられません。** 将来
「HID の代わりに I2C を積んだ版」のような派生が出る前提で、基板がどの版を
焼かれているかを名乗るようにしてあります。

| 版 | 内容 |
|---|---|
| 0 | HID 版（キーボード / マウス / ピン操作）。Tools → PWM = TIM2 Default |
| 1 | Remap3 版。HID 版と同じ機能で、PWM を 8 本出せる。Tools → PWM = TIM2 Remap3 |

版が違えばコマンドの意味ごと違うので、**バージョン不一致とは分けて報告します。**
バージョン不一致は書き込み直せば直りますが、版違いは「その版に対応した別の
拡張機能を使う」が正解のこともあるためです。

**版 0 は変えてはいけません。** 版を名乗らない世代のスケッチは
`PROTOCOL_VERSION` だけを 1 バイトで返すため上位バイトが 0 になり、
そのまま HID 版として扱われます。**既に配ってしまった基板を弾かないための約束**です。
新しい版は 1 から順に振り、以下の 3 箇所に同じ番号を足します。

- `sketches/ScratchUiapduino/ScratchUiapduino.ino` の `SKETCH_VARIANT`
- `scratch-vm/src/extensions/scratch3_uiapduino/variant*.js` の `SKETCH_VARIANT`（版ごとに 1 ファイル）
- `scratch-vm/src/extensions/scratch3_uiapduino/uiapduinoProcessor.js` の `VARIANT`（全部の版の名前）

バージョンは以下の 2 箇所にあり、**必ず同じ値**でなければなりません。
互換性の無い変更（コマンド ID・応答形式・パラメータの意味の変更）をしたら両方を上げます。

- `scratch-vm/src/extensions/scratch3_uiapduino/uiapduinoProcessor.js` の `PROTOCOL_VERSION`
- `sketches/ScratchUiapduino/ScratchUiapduino.ino` の `PROTOCOL_VERSION`

この照合には副次的な効果もあります。以前は**デバイスを開けただけで `connect()` が `true`**
を返していたため、スケッチが書かれていない基板でも「つながっている」状態になり、
その後すべてのブロックが無言で失敗していました。今はその場で `false` になります。

ブロックは Promise を返すため、Scratch はデバイスの実行完了を待ってから
次のブロックに進みます（ロックステップ動作）。

### ⚠ シーケンス番号がないことによる制約

このワイヤフォーマットには送受を対応付ける番号がありません。
タイムアウト後に遅れて届いた応答は、次のコマンドの応答と区別できません。

`uiapduinoProcessor` は「待ち手がいない応答は捨てる」ことしかできないため、
タイムアウトが起きた時点で警告を出し、`desyncSuspected` を立てます。
この状態になったら「実行待ちのコマンドをクリアする」ブロックか再接続で復帰してください。

---

## ⌨️ キーボードとマウスのブロック

**UIAPduino は HID なので、キーボードとマウスそのものになれます。これが他にない機能です。**
Scratch から PC 本体のカーソルを動かし、クリックし、文字をタイプできます。

| ブロック | コマンド |
|---|---|
| `キーボードで [Hello UIAPduino] と打つ` | `KEY_TEXT` を 29 文字ずつに分けて連投 |
| `キーボードの [Enter▼] キーを押して離す` | `KEY_WRITE` |
| `キーボードの [Ctrl▼] を押しながら〔 〕`（囲みブロック） | `KEY_PRESS` / `KEY_RELEASE` |
| `マウスを 右へ [ ] 下へ [ ] 動かす` | `MOUSE_MOVE` |
| `マウスの [左] ボタンをクリックする` | `MOUSE_CLICK` |
| `マウスの [左] ボタンでダブルクリックする` | `MOUSE_DBLCLICK` |
| `マウスの [左] ボタンで 右へ [ ] 下へ [ ] ドラッグする` | `MOUSE_DRAG` |
| `マウスの [左] ボタンでドラッグしながら〔 〕`（囲みブロック） | `MOUSE_PRESS` / `MOUSE_RELEASE` |
| `マウスのホイールを [下] に [ ] 回す` | `MOUSE_WHEEL` |
| `キーとマウスをすべて離す` | `PANIC` |

### ⚠ 「押したままにする」「離す」のブロックは置かない

**押しっぱなしにできるブロックを、意図的に用意していません。**

利用者が「離す」を書き忘れれば、ボタンは押されたまま残ります。そこで USB を抜かれると、
操作していたアプリのドラッグが取り残されます（後述）。**そもそも押しっぱなしを
作れないようにすれば、この問題の分類ごと消えます。**

代わりに、クリック・ダブルクリック・ドラッグを**デバイス側で完結する 1 コマンド**として
用意しました。押しっぱなしはコマンド 1 回の内側にしか存在できません。

デバイス側の `MOUSE_PRESS` / `MOUSE_RELEASE` は残してあります。囲みブロックが使うのと、
停止時の `PANIC` の経路で必要なためです。**ブロックとして露出していないだけです。**

**キーボードにも同じ方針を適用しています。** `キーを押したままにする` / `キーを離す` を
単独のブロックとしては置かず、押しっぱなしは `キーボードの [Ctrl▼] を押しながら〔 〕` の
**内側にだけ**作れるようにしました。囲みを抜ければ必ず離れます。

修飾キーの押しっぱなしは、マウスのボタンより厄介です。ボタンなら
「どこかを 1 回クリックすれば消える」のに対し、`Shift` や `Ctrl` は気づきにくく、
**その後のすべてのキー入力が化けます。** だからこそ、離し忘れが起こせない形にしています。

`Ctrl + C` は次のように書きます。

```
キーボードの [Ctrl▼] を押しながら〔
    キーボードで [c] と打つ
〕
```

入れ子にできます。`キーボードの [Ctrl▼] を押しながら〔 キーボードの [Shift▼] を押しながら〔 … 〕 〕` と書けば
`Ctrl + Shift + …` になります。同じ修飾キーを二重に囲んでも、押すのは一番外側に
入るときだけ、離すのは一番外側を抜けるときだけです。

### 🔁 `ドラッグしながら〔 〕`（囲みブロック）

直線 1 本のドラッグだけでは、円も折れ線も自由曲線も描けません。
`MousePractice` の practice4（円を描くドラッグ）のような題材が丸ごと落ちてしまいます。

そこで囲みブロックを用意しました。中に `マウスを 動かす` を並べれば、
押しっぱなしのまま好きな経路を辿れます。**そして囲みを抜ければ必ず離れます。**

`BlockType.LOOP` は「中身が終わったらもう一度呼ばれる」という性質を持ちます
（`repeat` ブロックと同じ仕組み）。これを使って、

```
1 回目の呼び出し : MOUSE_PRESS → util.startBranch(1, true) → 中身が動く
2 回目の呼び出し : MOUSE_RELEASE。startBranch を呼ばないのでここで終わる
```

としています。`util.startBranch()` は**同期的に呼ばなければならない**ので、
`MOUSE_PRESS` の応答は待ちません。待たなくても順序は崩れません。
`uiapduinoProcessor` のキューが直列化するので、中身の「動かす」は必ず `press` の後ろに並びます。

入れ子にされたときは、**一番外側に入るときだけ押し、一番外側を抜けるときだけ離します**
（`_dragDepth` で数える）。これが無いと、内側の囲みを抜けた時点で離れて外側が途切れます。

**⚠ 中身の途中で止められると 2 回目が来ません。**

| 止まり方 | 受け止める仕組み |
|---|---|
| 停止ボタン / 緑の旗 | `PROJECT_STOP_ALL` → `PANIC` |
| `このスクリプトを止める` など | デバイス側の見張り（最後のコマンドから 5 秒） |
| USB を抜かれた | 誰も後始末できない（後述）|

### 動く先はフォーカスのあるウィンドウ

**タイプもクリックも、その時点でフォーカスのあるウィンドウに届きます。**
Scratch を触ったまま実行すれば、相手は Scratch 自身です。

メモ帳などを操作させたいときは「n 秒待つ」を挟み、その間に利用者が
対象のウィンドウをクリックする、という組み方をします。
uiap-hid-web の `mouse.html` / `keyboard.html` と同じ考え方です。

Scratch にフォーカスが残ったままだと、送ったキーが Scratch 自身の
「〇〇キーが押されたとき」やショートカットを動かします。事故にもなりますが、
「UIAPduino が自分の Scratch を操作する」教材にもできます。

### ⚠ 暴走したときに止められること

**Scratch から PC のキーボードとマウスを乗っ取れるということは、
暴走したら利用者が止められないということです。** 2 つの逃げ道を用意してあります。

| 仕掛け | どこ | 動き |
|---|---|---|
| 停止ボタン | Scratch 側 `index.js` | `PROJECT_STOP_ALL` で実行待ちを捨て、`PANIC` を送る |
| 「切断」ボタン | Scratch 側 `index.js` | 閉じる**前に** `PANIC` を送る |
| アプリを閉じる | Scratch 側 `index.js` | `beforeunload` で `PANIC` を送る（best-effort） |
| 押しっぱなしの見張り | デバイス側 `.ino` | 最後のコマンドから **5 秒**過ぎても何か押されたままなら全部離す |
| USB を抜かれた | scratch-desktop の main | 自分のウィンドウに `mouseUp` を送る。他アプリまでは直せない（後述） |

停止ボタンで実行待ちを捨てるのは、捨てないと止めたはずなのにキューに残った
移動やクリックが最後まで動き続けるためです。

「切断」で先に `PANIC` を送るのは、送らずに閉じると基板が押しっぱなしのまま残り、
見張りが働くまでの 5 秒間ボタンが押されたままになるためです。

アプリを閉じるときの `PANIC` は **best-effort です。** `beforeunload` はページの
後始末を待ってくれないので、Feature Report が飛ぶ前にウィンドウが閉じることがあります。
確実に離す役目はデバイス側の見張りが負います。

見張りの起点は「最後のコマンド」なので、時間のかかる移動の途中で離れることはありません。
「押したままにする」→「1 秒待つ」→「離す」は 5 秒以内なので通ります。
「押したままにする」だけ実行して手で何か操作する、という使い方は 5 秒で離れます。

**マウスが暴れているとき、停止ボタンを押すこと自体が難しくなります。**
これはブロック側では解決できません。緑の旗を押す前に、キーボードだけで
Scratch に戻る手順を確認しておいてください。

### 🔌 「ケーブルを抜く」を最終手段として成立させる

**マウスとキーボードの自動化は危険な操作です。** 何か怪しい動きを始めたときに
「とにかく物理的にケーブルを抜けば必ず全部離れる」という逃げ道が要ります。
停止ボタンも見張りも、暴走の仕方によっては間に合いません。

ところが、素朴に作るとこれが成立しません。ボタンを押したまま基板が居なくなると、
Chromium が `WM_LBUTTONUP` を受け取れないまま取り残され、
**Scratch のウィンドウの中だけ「左ボタンが押されたまま」**になります。

**デバイス側にはもう何もできません。**
基板はバスから電源を取っているので、抜かれた時点で止まります。
5 秒の見張りも動けません。Scratch も居なくなったデバイスには何も送れません。

#### 直せるのは自分のウィンドウの中だけ（実機で切り分け済み）

**取り残されるのは Scratch とは限りません。** mousedown を受け取ったウィンドウが
取り残されるので、メモ帳を操作させている最中なら、残るのはメモ帳です。
むしろそちらが本来の使い道です。

| 対象 | 抜いた後の状態 | 直し方 |
|---|---|---|
| **OS 全体のボタン状態** | **down のまま残る** | 入力注入のみ。**採用せず**（後述）|
| **mousedown を受け取った他アプリ** | ドラッグ中のまま | **自動では直せない。**どこかを 1 回クリックすれば消える |
| **Scratch 自身**（Scratch の上で押した場合） | Chromium が掴んだまま | **自分のウィンドウに `mouseUp`**。自動で直る |

```
USB を抜く
  → navigator.hid の disconnect
  → scratch-vm の拡張が押しっぱなしの心当たりを確認
  → ipcRenderer.send('uiapduino-release-held-input')
  → main プロセスが webContents.sendInputEvent(mouseUp) を送る
  → その後で Scratch 標準の「接続が切れました」
```

`sendInputEvent` は Electron が**正規の入力イベント**として流すので、
Chromium の内部状態も Scratch 側の JS のドラッグ処理も、両方きちんと終わります。
座標はカーソルの現在位置に合わせます。掴んだままの要素に届かせるためです。

**押しっぱなしの心当たりがないときは呼びません。**
`マウスの [左] ボタンを押したままにする` を送った後だけです。

#### 結論：「ケーブルを抜く」が保証すること

| | |
|---|---|
| **デバイスの動作** | **必ず止まる。ここは絶対** |
| Scratch 自身の押しっぱなし | 自動で外れる |
| 操作していた他アプリのドラッグ | 残る。**どこかを 1 回クリックすれば消える** |

**PC が操作不能になることはありません。** 残るのはクリック 1 回の手間だけです。
なお、OS 側が down のままなので**その 1 回目のクリックは消費されます**
（既に down なので押しても変化が無く、離したときの up だけが出る）。
2 回目から普通に使えます。

#### ⛔ 試して捨てた案が 3 つある

同じ道を辿る人が出るので、なぜ捨てたかを残します。

**1. PowerShell から `user32` の `keybd_event` / `mouse_event` を P/Invoke**

**Avast が `IDP.HELU.PSE85`（コマンドライン検出）でブロックします。**

| 要素 | ウイルス対策ソフトから見た意味 |
|---|---|
| `powershell.exe -EncodedCommand <base64>` | 難読化されたコマンド。最も警戒される形 |
| `Add-Type` による C# の動的コンパイル | その場でコードを生成して実行 |
| `user32.dll` の入力 API を P/Invoke | キー入力・マウス操作の注入 |

マルウェアの典型パターンそのものなので、**検出される方が正しい動作です。**
学校で使うツールがウイルス警告を出すのは通りません。

**2. フォアグラウンドを奪って、他アプリのマウスキャプチャを打ち切る**

Windows はフォアグラウンドが変わるとキャプチャを握っているアプリへ
`WM_CAPTURECHANGED` を送るので、理屈の上では成立します。
**しかし実機では効きませんでした。** `BrowserWindow.focus()` も、
1x1 の新規ウィンドウを一瞬出す手も、どちらも他アプリのドラッグを解除できません。

Windows の `SetForegroundWindow` には制限があり、入力を受け取っていない
バックグラウンドのプロセスは原則としてフォアグラウンドを奪えません。
UIAPduino が出していた入力は相手のアプリへ行っていたので、Scratch 側に資格がありません。
そもそも OS 側が down のままなので、**仮に奪えても根治しません。**

**3. koffi（N-API の FFI）でプロセス内から `user32` を呼ぶ**

外部プロセスを起こさず、コマンドラインも動的コンパイルも無いので、
1 の検出には当たりません。**技術的には成立します**
（Electron 15 / ia32 では **koffi 2.8.0** が動くことを確認済み。
3.x と 2.16.3 は N-API 9 以上を要求するため載りません）。

採用しなかった理由は 2 つです。

- **落ち方が変わる。** FFI の関数宣言を誤ると JavaScript の例外にならず、
  プロセスごと落ちます。子どもが使う道具として質の違うリスクです
- **固定バージョンのネイティブ依存を抱える。** koffi 2.8.0 は 15 プラットフォーム分の
  バイナリを同梱していて 68MB あり、`files` での除外と `asarUnpack` の設定が必要になります

得られるのは「クリック 1 回の手間が減る」ことだけで、**見合いません。**

#### 切り分けには手順が要る

**確かめようとしてウィンドウを切り替えるだけで、その 1 クリックが状態を解除します。**
`Alt+Tab` でキーボードだけで切り替えると、クリックせずに観測できます。

**そして「Scratch の上で押しっぱなしにする」テストからは何も一般化できません。**
mousedown を受け取ったのが Chromium なのだから、Chromium が残るのは当たり前です。
**実際の使い方（他アプリを操作させる）で確かめる必要があります。**
この取り違えで一度、誤った結論（「OS 全体の状態は正常」）に至りました。

#### ⛔ OS への入力注入は実装したが、捨てた

`user32` の `keybd_event` / `mouse_event` を PowerShell から P/Invoke する実装を
一度作りましたが、**採用していません。**

**Avast が `IDP.HELU.PSE85`（コマンドライン検出）でブロックします。**

| 要素 | ウイルス対策ソフトから見た意味 |
|---|---|
| `powershell.exe -EncodedCommand <base64>` | 難読化されたコマンド。最も警戒される形 |
| `Add-Type` による C# の動的コンパイル | その場でコードを生成して実行 |
| `user32.dll` の入力 API を P/Invoke | キー入力・マウス操作の注入 |

マルウェアの典型パターンそのものなので、**検出される方が正しい動作です。**
学校で使うツールがウイルス警告を出すのは通りません。
そして上記のとおり、**そもそも OS 全体の問題ではなかったので、やる必要もありませんでした。**

試す過程で分かったことを 2 つ残しておきます。

- **日本語 IME の環境では VK `0xF4` が常に「押されている」と報告されます。**
  物理キーではなく IME の状態表示です。仮想キーを端から端まで走査して KEYUP を
  注入する素朴な実装だと、UIAPduino と無関係に IME を触ることになります。
- **OS 全体で押しっぱなしになった場合、実マウスの 1 回目のクリックは消費されます。**
  Windows はボタン状態を「全マウス合算の現在値」で持つため、既に down のときに
  実マウスを押しても変化が無く、down イベントが発生しません。離したときの up だけが出ます。
  つまり 1 回目は状態の解除に使われ、クリックとしては効きません。

### ⚠ 移動量と分割数（切り捨てに注意）

`Mouse.moveLarge(x, y, wheel, steps)` は 1 ステップあたり `x / steps` px を送りますが、
**USB の相対移動は 1 レポート ±127px までで、超えた分は黙って切り捨てられます。**

```
moveLarge(300, 0, 0, steps=1)
  bx = 300 / 1 = 300
  mx = 300      → move() の中で clamp8 が 127 に丸める
  x -= 300 → 0  → 送ったのは 127px なのに 300px 送った扱いでループ終了
```

`steps` を固定にすると「`127 × steps` px より大きい移動が途中で止まる」という、
エラーも出ない壊れ方をします。既定の 10 でも 1270px が上限で、
フル HD の画面を横断できません。

そこでデバイス側 `stepsForMove()` が、1 ステップが必ず 127px 以下になるように
分割数を決めます。下限は 10 です。1 ステップにつき 10ms かかるので、
画面の端から端（1920px）でも 16 ステップ = 約 160ms で収まります。

Scratch 側 `index.js` の `_moveTimeout()` が**同じ式**で応答待ち時間を計算しています。
既定の 3 秒のままだと画面 3 枚分を超える移動でタイムアウトするためです。
**片方だけ変えるとタイムアウトするので、変えるときは両方を直してください。**

### ホイールは 1 刻みずつ送る

ホイールの刻みを 1 レポートにまとめて送ると、値を無視して 1 刻み扱いにする
アプリがあります。デバイス側は 1 刻みずつ 10ms かけて送ります。
そのぶん回数が多いと時間がかかるので、Scratch 側で 100 回を上限にしています。

### キーボードの制約

- **日本語は打てません。** HID はキーコードを送るだけで、IME は通りません。
  ASCII 以外の文字は送らず、開発者コンソールに警告を出します。**無言で化けるのが最悪**なためです。
- **US 配列前提です。** 日本語配列の PC では `@ : _ [ ] \ ^` などがずれます。
  英数字と空白は配列によらず正しく入るので、まずはそこまでを確実に動かします。
  記号に対応する場合はブロックに「キーボード配列」の選択を持たせ、Scratch 側で
  記号のキーコードを差し替えることになります。**デバイス側は変更不要です。**
- **1 コマンドで送れるのは 29 文字です。** Feature Report は 32 バイトですが、
  `[0]` がコマンド ID、`[1]` がフラグ、そして**デバイス側が `buf[31] = 0` で終端を強制する**ため、
  文字を置けるのは `[2..30]` の 29 バイトだけです。30 文字入れると最後の 1 文字が消えます。
  Scratch 側は 29 文字ずつに切って連投します。
- **`Shift` を押しながらタイプすると、大文字小文字が入れ替わります。**

  | 書いたもの | 打たれるもの |
  |---|---|
  | `キーボードで [Hello] と打つ` | `Hello` |
  | `キーボードの [Shift▼] を押しながら〔 キーボードで [Hello] と打つ 〕` | `hELLO` |
  | `キーボードの [Shift▼] を押しながら〔 キーボードで [1] と打つ 〕` | `!` |

  大文字を打つのに内部で `Shift` を使う以上、外側の `Shift` と重なったときの
  振る舞いを決めておかないと、どちらが勝つのか説明できません。反転なら
  「`Shift` を押しながらタイプすると大文字小文字が入れ替わる」の一文で済みます。
- **`Ctrl` と組み合わせる文字は小文字で書いてください。**
  `キーボードの [Ctrl▼] を押しながら〔 キーボードで [C] と打つ 〕` と大文字にすると、大文字を出すために
  `Shift` が入るので `Ctrl + Shift + c` になり、コピーが効きません。
  `と打つ` は書いたとおりの文字を打つブロックなので、ここは仕様どおりの動きです。
  **小文字の `c` と書けば `Ctrl + c` になります。**
- 囲みブロックの中身の途中でスクリプトが止まると、修飾キーが押されたまま残ります。
  停止ボタンなら `PANIC` が拾い、それ以外の経路はデバイス側の見張り（5 秒）が受けます。

`sketches/ScratchUiapduino/ScratchUiapduino.ino`

```
sketches/ScratchUiapduino/
  ScratchUiapduino.ino   … 本体
  sketch.yaml            … ボードと Tools メニューの設定
```

### スケッチの書き込みについて

#### ⚠ 緑の旗からは焼けません

`navigator.hid.requestDevice()` がクリック直後であることを要求するためです。
「ブロックをクリックしてください」で止まります。**事故防止も兼ねています。**

デスクトップ版は `getDevices()` で拾えるので、この制限がありません。代わりに
`main/index.js` が `1209:B803`（書き込みモードの基板）を許可している必要があります。

#### ⚠ 「接続が失われました」のアラートは消えません

繋がっている基板を抜いて書き込みモードに入れると出ます。**焼いて繋ぎ直しても
このアラートだけが取り残されます。** こちらでは直せません。

閉じられるのは × と 再接続 だけで、繋がり直したときに消す処理が `scratch-gui` に
ありません（`vm-listener-hoc.jsx` が出し、`reducers/alerts.js` に該当の分岐が無い）。
拡張機能からアラートを閉じる方法もありません。

**「合いません」と言われた基板を焼き直す場合は、繋がっていないので出ません。**

#### ⚠ 書き込みブロックは同梱のスケッチを焼きます

`.ino` を直して Arduino IDE で焼いても、あとで
`スケッチ (プロトコル 8) を書き込む` が押されれば**同梱のスケッチで上書きされます。**
押すのが自分とは限りません。

直した `.ino` を使い続けるなら、[同梱スケッチを作り直す](#同梱スケッチを作り直す)まで
通してください。そこまでやって初めて、拡張機能と基板の版が揃います。

#### 以前の書き込み方法（v0.2.3 まで / Arduino IDE）

**v0.2.3 まではこの手順が必須でした。今は上のブロックで焼けます。**
記録として残してあります。詳しくは Core 側の
[README](https://github.com/tarosay/arduino_core_ch32#書き込み方法) を見てください。

**1. Arduino IDE にボードを入れる（初回だけ）**

`ファイル → 環境設定 → 追加のボードマネージャのURL` に次を追加します。

```
https://github.com/tarosay/board_manager_files/raw/main/package_uiap_hid_index.json
```

「ボードマネージャ」で `UIAPduino` を検索してインストールし、
`ツール → ボード → UIAP_HID → HID ProMicro CH32V003` を選びます。

> **基板はお店やネットショップで購入してください。**
> 上で配布しているのは Arduino IDE の Core（ボード定義）で、基板そのものではありません。

**2. 基板を書き込みモードにする**

**基板のボタンを押しながら USB ケーブルを接続し、すぐにボタンを離します。**

**3. 書き込む**

`ScratchUiapduino.ino` を開いて、いつもどおり「書き込み」を実行します。

**書き込み器（WCH-LinkE など）は要りません。** `Tools > Upload method` は既定の
`minichlink` のままで構いません。プログラマの指定が無いとき minichlink は
書き込み先を順に探し、`Found UIAPduino Pro Micro CH32V003 V1.4 Bootloader` を
見つけて、そこへ `.bin` を USB 経由で流し込みます。

##### 書き込み設定（当時の Tools 設定）

**`sketch.yaml` に固定してあるので、手で設定し直す必要はありません。**
Arduino IDE 2.x はスケッチを開いたときにこのプロファイルを読みます。

参考までに、`sketch.yaml` の `fqbn` は以下と対応します。

| Tools | 値 | fqbn |
|---|---|---|
| Board | HID ProMicro CH32V003 | `UIAP_HID:ch32v:CH32V003` |
| Board Version | V1.4 | `pnum=V14` |
| USB | **Keyboard+Mouse+WebHID** | `usb=kbdweb` |
| PWM | **TIM2 Default (pin 2 / PC0)**（HID 版）/ TIM2 Remap3 (pins 9/15/16)（Remap3 版） | `pwm=default` / `pwm=remap3` |
| Optimize | Smallest (-Os) with LTO | `opt=oslto` |
| U(S)ART support | **None (use UIAPSerial)** | `xserial=none` |

PWM の設定は、どちらを選んでもビルドは通ります。**どちらの版になるかを決めるのがこの設定です。**
スケッチは設定から `SKETCH_VARIANT` を決めて PING の応答で名乗るので、
拡張機能と違う版を焼いてしまっても、繋いだ時点で「別の版」と分かります。

`xserial` は既定値ですが明示してあります。`HardwareSerial` にすると、`Serial` を一度も
呼ばなくても Flash が約 **4748 バイト**増えて 16KB に収まりません。シリアル通信は
同梱の `UIAPSerial.h` / `.cpp` で行っています。

プラットフォームは `UIAP_HID:ch32v (1.2.12)` に固定してあります。
再現性のためですが、**新しい版が出ても 1.2.12 が使われ続ける**点に注意してください。
上げる場合は `sketch.yaml` の `platforms` を書き換えます。

1.2.10 から上げたのは、**`NeoPixelmin` が 1.2.10 に入っていない**ためです
（初出は 1.2.11、`SysTick` 版は 1.2.12）。1.2.10 のままでは NeoPixel のブロックが
ビルドできません。

#### 同梱スケッチを作り直す

**`.ino` を直したら、拡張機能に埋め込んである `.bin` も作り直してください。**
忘れると、書き込みブロックが古いスケッチを焼き続けます。

同じ `.ino` から 2 つの版を作るので、`.bin` も 2 つあります。
違うのは Tools → PWM だけで、`sketch.yaml` のプロファイルで選びます。

| 版 | プロファイル | 埋め込みの元（追跡している） | 生成物（手で書かない） |
|---|---|---|---|
| HID 版 | `uiapduino`（既定） | `sketches/ScratchUiapduino.ino.bin` | `sketchBin.js` |
| Remap3 版 | `uiapduino-remap3` | `sketches/ScratchUiapduino-remap3.ino.bin` | `sketchBinRemap3.js` |

1. arduino-cli で両方のプロファイルをビルドし、**`.bin` だけ**を上の名前で `sketches/` へ
   上書きコピーする（`.elf` / `.hex` / `.map` は要りません）。
   Remap3 版は `--profile uiapduino-remap3` を付けます
2. `cd xcratch; npm run embed-bin` と `npm run embed-bin -- remap3`
3. `npm run build`
4. `.bin` と `sketchBin*.js` と `docs/*.mjs` を**一緒にコミットする**

`embed-bin` は `.bin` の大きさ（16,384 バイト以下）を確かめ、`.ino` から
`PROTOCOL_VERSION` を読んで生成物に書き込みます。**その番号が拡張機能側の定数と
食い違っていると、書き込みブロックは焼かずに止まります。** 2 を忘れたまま配っても、
古いものが焼かれることはありません。

出力は決定的なので、走らせ直しても中身が変わらなければ差分は出ません。

**固定先は実機確認に使った版と一致させること。** この数字は 2 回取り残されています。
1.2.8 と書いてあった時期も、1.2.9 と書いてあった時期も、その版でビルドも実機確認も
していません。更新し忘れた数字が残っていただけです。「再現性のために固定する」と
言いながら、固定先が一度も通っていない版では意味がありません。

**上げるときは、上げる前後で `.hex` が変わるかを見ます。** 1.2.9 → 1.2.10 では
`.bin` / `.elf` / `.hex` がバイト単位で一致し、Flash も RAM も同じ値でした
（`.map` だけは中にプラットフォームのパスが文字列で入るので変わります）。
中身が同じなら、固定先を上げても基板を焼き直す必要はありません。

arduino-cli なら引数なしで HID 版をビルドできます。Remap3 版はプロファイルを指定します。

```
arduino-cli compile sketches/ScratchUiapduino
arduino-cli compile --profile uiapduino-remap3 sketches/ScratchUiapduino
```

### ⚠ USB は `Keyboard+Mouse+WebHID` でなければならない

**バージョン 1 では `WebHID Only` でした。バージョン 2 で変わっています。**

UIAPduino は HID なので、キーボードとマウスそのものになれます。これが他にない機能で、
Scratch から PC のキーボード入力とマウス操作ができます。`WebHID Only` では
インタフェースが 1 つだけになり、キーボードとマウスのブロックが動きません。

ホストから見える形は両設定で同一です（エンドポイント番号だけが EP1 → EP3 に変わりますが、
これはホスト側からは見えません）。Scratch 側の通信層は無変更で動きます。

| | Keyboard+Mouse+WebHID | WebHID Only |
|---|---|---|
| VID / PID | `0x1209` / `0xD004` | 同じ |
| Usage Page / Usage | `0xFF00` / `0x01` | 同じ |
| Input Report | 8 バイト | 同じ |
| Feature Report | 32 バイト | 同じ |
| エンドポイント | EP3 IN | EP1 IN |
| インタフェース数 | 3 | 1 |

`WebHID Only` を選んでいた元の理由は、同じ VID/PID のキーボードコレクションを
Scratch 側の `getDevices()` が拾う余地をなくすことでした。
これは `uiapduinoProcessor._findDevice()` が `0xFF00` / `0x01` を持つコレクションを
優先して選ぶことで解決済みです。`requestDevice()` 側もフィルタに Usage Page が
入っているため、キーボードのコレクションは候補に上がりません。

### Flash 使用量

16KB しかないので、機能を足すたびに測っています。

| 版 | Flash | RAM |
|---|---|---|
| バージョン 1（ピン操作のみ / WebHID Only） | 6684 / 16384 (40%) | 180 / 2048 (8%) |
| バージョン 2（キーボード + マウス + 見張り） | 9728 / 16384 (59%) | 272 / 2048 (13%) |
| バージョン 3（ダブルクリック + ドラッグ） | 9916 / 16384 (60%) | 272 / 2048 (13%) |
| バージョン 4（キーボードの囲みブロック） | 9804 / 16384 (59%) | 272 / 2048 (13%) |
| バージョン 5（大文字と記号の修正） | 10012 / 16384 (61%) | 272 / 2048 (13%) |
| バージョン 6（サーボ + 距離計） | 10504 / 16384 (64%) | 272 / 2048 (13%) |
| バージョン 7（シリアル通信） | 11148 / 16384 (68%) | 532 / 2048 (25%) |
| バージョン 8（NeoPixel） | **12040 / 16384 (73%)** | **744 / 2048 (36%)** |

サーボと距離計の 2 つで **+492 バイト**、RAM は増減なしでした。

シリアル通信は **+644 バイト**、RAM は **+260 バイト**です。RAM が増えたのは
受信バッファを 256 バイト取っているためで、これは `UIAPSerial.h` の既定値 64 から
広げたものです。コマンドの実行中はデバイスが占有されるので、その間に届いた分を
落とさないだけの深さが要ります（9600 baud なら 64 バイトは 67ms しか持ちません）。

NeoPixel は **+892 バイト**、RAM は **+212 バイト**です。RAM は LED 64 個分の
バッファ 192 バイト（1 個 3 バイト）とオブジェクトの残りです。

`NeoPixelmin` は波形を GPIO のサイクル数え上げではなく SPI1 で作ります。
UIAPduino の USB はソフトウェア実装（rv003usb）で時間の制約が厳しく、
数え上げ方式だと USB が落ちるためです。**ただし SPI で作っても、送出中に
50µs を超える割り込みが入るとフレームが壊れます。** ソフトウェア USB の割り込みは
これを超えるので、`show()` の間だけ割り込みを止めています（`NEOPIXELMIN_ATOMIC`）。

リセット待ちに `micros()` ではなく `SysTick->CNT` を使っています。
`micros()` を使うと **+2224 バイト**で、ドライバ本体（800 バイト）の 2.6 倍を
待ち時間ひとつのために払うことになります。

距離計で `pulseIn()` を使っていれば、これに **+2.2KB** されていました。`pulseIn()` は
`micros()` を呼び、`micros()` は `millis()` と同じ `uint64_t` の除算を引き込むためです
（詳細は「[⚠ `micros()` と `pulseIn()` は使いません](#-micros-と-pulsein-は使いません)」）。

**押しっぱなしの見張りに `millis()` を使っていません。**
CH32V003 の `millis()` は `uint64_t` の除算を引き込むため、これ 1 つで
**2264 バイト（Flash 全体の 14%）** 増えます。実測で確かめました。
何か押されている間だけ `delay(1)` で 1ms ずつ数えれば、追加の Flash なしで正確に測れます。
待つのはどうせ次のコマンドが来るまでの空き時間で、USB のポーリングが 10ms 間隔なので
1ms の遅れは表に出ません。

### ⚠ 使ってはいけないピン

CH32V003 では以下が潰せないピンです。スケッチ側で弾いて `RSP_ERR` を返します。

| ピン | 用途 |
|---|---|
| D13 (= A4) | USB D+ |
| D14 (= A7) | USB D− |
| D17 | RESET |

**D13 / D14 に触ると USB が落ちて Scratch との接続が切れます。**
オンボード LED は **D2** です。

次の 2 つは**条件付き**で、使い始めたときだけ弾かれます。使わない作品からは取り上げません。

| ピン | いつ弾かれるか | 用途 |
|---|---|---|
| D15 / D16 (= A5 / A6) | `シリアル通信 ボーレート [ ] で開始する` の後 | USART1 の Tx / Rx |
| D8 | `NeoPixel を [ ] 個 … で始める` の後 | NeoPixel の DIN（SPI1 MOSI） |

D8 にアナログチャンネルはないので、弾かれるのはデジタル側だけです。
NeoPixel が使うのは MOSI (PC6) だけで、**SCK (D7) / MISO (D9) / NSS (D3) は空いたまま**です。

`analogRead` は Arduino 標準どおり**アナログ番号 (A0–A7)** 解釈で、デジタルピン番号ではありません。

| A 番号 | 実ピン |
|---|---|
| A0 | PA2 (D1) |
| A1 | PA1 (D0) |
| A2 | PC4 (D6) |
| A3 | PD2 (D12) |
| A5 | PD5 (D15) |
| A6 | PD6 (D16) |

### 📺 アナログ値のステージ表示

`A0 の値`〜`A3 の値` は、パレットのチェックボックスでステージに値を出すための
**引数を持たないレポーターブロック**です。中身は `ピン [PIN] の値` と同じ `CMD_ANALOG_READ` で、
チャンネル番号を固定しているだけです。

**なぜ `ピン [PIN] の値` にチェックボックスが出ないのか。**
scratch-vm は「入力を 1 つも持たないレポーター」にだけ
チェックボックス (`checkboxInFlyout`) を付けます (`scratch-vm/src/engine/runtime.js`)。
`ピン [PIN] の値` は数値入力を持つため対象外です。

ドロップダウン (`acceptReporters: false`) にすればチェックボックス自体は出せますが、
モニターのラベルは `getLabelForOpcode()` がブロックのテキストをそのまま使うため
`UIAPduino: ピン [PIN] の値` のままになり、A0 と A1 の区別が付きません。
そのため scratch3-tello のピッチ／ロール／ヨーと同じく、チャンネルごとにブロックを分けています。

チェックが入っている間は、**緑の旗を押していなくても** Scratch が毎フレーム値を読みにきます。
ただし前回の応答を待っている間はスレッドが再投入されず (`runtime.addMonitorScript()`)、
`uiapduinoProcessor` 側もコマンドを直列化するため、実際は「応答が返ったら次を送る」ペースになります。

A4 / A7 は USB ピンなのでブロックを用意していません。A5 / A6 は `ピン [PIN] の値` で読めます。

**⚠ 「ファイル → 新規」でチェックが外れません。** 表示は消えるのにチェックだけが残り、
外して入れ直すと出ます。**この拡張機能に限った話ではなく、直せる場所もありません。**

チェックを外す処理（`scratch-gui` の `containers/blocks.jsx` の `handleMonitorsUpdate`）は
「今あるモニター」だけを回しますが、「新規」で `runtime.dispose()` がその一覧を空にするため、
繰り返しが 1 回も回りません。スプライト固有のもの（`x座標` など）が外れて見えるのは、
ブロックの ID にスプライトの ID が入っていて（`<block id="${targetId}_xposition">`）、
新規で別のブロックになるからで、外れたわけではありません。ID が固定の `タイマー`
（`id="timer"`）は同じ症状になります。**拡張機能のレポーターは必ずこうなります。**

### 🔋 アナログ値の 1023 は「基板の電源電圧」です

`A0 の値` などが返すのは 0〜1023 の 10bit の数で、**上限の 1023 は基板の電源電圧**にあたります。
固定の電圧ではありません。

| 基板の状態 | 1023 が意味する電圧 | 1 目盛 |
|---|---|---|
| **出荷時（5V 駆動）** | 5V | 約 4.9mV |
| 3.3V に改造した基板 | 3.3V | 約 3.2mV |

電圧に直すときの式です。

```
電圧 = 値 ÷ 1023 × 電源電圧
```

**UIAPduino は出荷時 5V 駆動です。** 5V 配線をカッターなどで切断して 3.3V に
ジャンパすると、基板全体が 3.3V 駆動に切り替わります。改造した基板では上の表の
下の行になり、**同じセンサーを繋いでも返る数が変わります。**

センサーの出力が電源電圧を超えないようにしてください。超えた分は 1023 で頭打ちになります。

実機では 5V を入れて `0x3FF`（1023）、GND で 1〜2（ADC のノイズフロア）を確認しています。

### ⚠ PWM は `analogWrite()` を使いません

**CH32V003 で `analogWrite()` を使ってはいけません。**
[arduino_core_ch32 の README](https://github.com/tarosay/arduino_core_ch32) に明記されています。

`analogWrite()` は `HardwareTimer` を丸ごと引き込むため 16KB Flash には重すぎる上に、
Scratch のブロックが普通にやってしまう操作で壊れます。

| 症状 | Scratch でいつ起きるか |
|---|---|
| TIM1 と TIM2 の両方に `analogWrite()` すると**無言でフリーズ** | 別々のピンに PWM を出しただけ |
| `analogWrite()` → `pinMode()` → `analogWrite()` の往復で**RAM が減り続ける** | ループの中で PWM とピン設定を往復しただけ |

このスケッチは `PWMmin` の `Pwm_write()` を使います。動的確保をしないのでどちらも起きません。

PWM を出せるピンは **Tools → PWM の設定で変わります**。`TIM2 Default` の場合:

| タイマー | ピン |
|---|---|
| TIM1 | D0 / D5 / D6 / D12 |
| TIM2 | **D2**（オンボード LED） |

`Remap3` にすると TIM2 が D3 / D9 / D15 / D16 に変わります。
PWM 非対応ピンに `analogWrite` ブロックを使った場合、
黙ってデジタル出力にフォールバックせず `RSP_ERR` を返します。

「ピンを入力／出力にする」ブロック（`PIN_MODE`）は先に `Pwm_stop()` を呼ぶので、
PWM 中のピンを普通の GPIO に戻せます。

**「出力」にしたピンは Low から始まります。** `pinMode(OUTPUT)` は出力する値（`OUTDR`）に
触れないので、そのままだと前に「入力（プルアップ）」や「出力を 1」を使ったピンが
出力にした瞬間に High を出します。実機で、D3 と D5 に繋いだ LED が「出力にしただけ」で
点きました（2026-09-27）。スケッチは切り替える前に Low を書いてから出力にします。

### 🦾 サーボのブロック

`サーボ [2▼] を [90] 度にする`（バージョン 6 で追加）。

ピンは数値入力ではなく**メニュー**にしてあります。PWM を出せるのは 5 本だけで、
それ以外のピンを選べる形にすると「繋いだのに動かない」を試させることになるためです。

| メニュー表記 | Arduino 番号 | ポート | タイマー |
|---|---|---|---|
| `2` | 2 | PC0 | TIM2-CH3（オンボード LED） |
| `5` | 5 | PC3 | TIM1-CH3 |
| `A1` | **0** | PA1 | TIM1-CH2 |
| `A2` | **6** | PC4 | TIM1-CH4 |
| `A3` | **12** | PD2 | TIM1-CH1 |

**表記と Arduino 番号が食い違って見えますが、間違いではありません。**
基板のシルクが `PA1 = A1` / `PC4 = A2` / `PD2 = A3` だからです。
基板に書いてある名前で選ばせ、デバイスへは Arduino 番号を送ります。
この `A1` / `A2` / `A3` は `A1 の値` などのアナログ入力ブロックと**同じ物理ピン**を指します
（ADC のチャンネル 1 / 2 / 3 が PA1 / PC4 / PD2）。

#### 🔧 `サーボの設定` ブロック

```
サーボの設定 周波数 [50] Hz 範囲 [500] 〜 [2270] µs
```

**置かなくても動きます。** サーボを変えて可動域が合わないときだけ置きます。
角度 0 が下限 µs、180 が上限 µs、間は比例配分です。

| | 既定値 | 根拠 |
|---|---|---|
| 周波数 | 50 Hz | サーボの規格 |
| 下限 | 500 µs | SG-90 で実測 |
| 上限 | 2270 µs | SG-90 で実測 |

既定値での角度と duty の対応です。

| 角度 | パルス幅 | duty |
|---|---|---|
| 0 | 500 µs | 6 |
| 45 | 943 µs | 12 |
| 90 | 1385 µs | 18 |
| 135 | 1828 µs | 23 |
| 180 | 2270 µs | 29 |

#### ⚠ デバイスは「サーボ」を知りません

**角度・パルス幅・可動域はすべて Scratch 側が持っています。** デバイスへ届くのは
`このピンに、この周波数で、この duty を出せ` だけです。

そうしている理由は、**サーボごとに可動域が違う**からです。デバイス側に角度を
解釈させると、サーボを変えるたびに基板を焼き直すことになります。
Scratch の利用者にそれはできません。設定ブロックを 1 つ置けば済む形にしてあります。

副産物として、`SERVO`（`0x26`）と `ANALOG_WRITE`（`0x24`）は**中身が全く同じ**に
なりました。スケッチでも同じ `case` で処理しています。ID を分けたままにしてあるのは、
`hid-console.html` でログを追うときに、どちらのブロックが出したものか
生バイトで区別できるようにするためです。

#### 既定値をどう決めたか

**可動域はサーボごとに違うので、既定値は「これが正しい」というものではありません。**
手元の SG-90 で 0〜180° が収まった範囲が `500 〜 2270 µs` だったので、それを採ってあります。

`uiapruby` が生成するファームは `0.5 〜 2.4ms` を使っていますが、同じ値にはしていません。
合わせるべきなのは他のファームではなく、実際に繋ぐサーボの方だからです。

他のサーボで思った角度にならなければ、設定ブロックで変えられます。

#### ⚠ 既定の 50Hz では刻みが約 7.8°

`Pwm_write()` は `ATRLR = 255` 固定の 8bit なので、**1 周は常に 256 目盛**です。
周期は周波数で決まるため、周波数を下げるほど 1 目盛が粗くなります。

| 周波数 | 周期 | 1 目盛 | 500〜2270µs の段階 | 角度の刻み |
|---|---|---|---|---|
| **50 Hz**（既定） | 20000 µs | 78 µs | 24 | 約 7.8° |
| 100 Hz | 10000 µs | 39 µs | 45 | 約 4.0° |
| 200 Hz | 5000 µs | 20 µs | 91 | 約 2.0° |
| 400 Hz | 2500 µs | 10 µs | 181 | **約 1.0°** |
| 500 Hz | 2000 µs | 8 µs | — | **2270µs が周期を超える** |

既定では **角度 90 と 95 は同じ位置になります。** 細かくしたいときは設定ブロックで
周波数を上げます。ただしサーボが高いフレームレートに耐えるかは製品次第です。

**µs 入力は、実際には無い精度があるように見えます。** 50Hz では 1 目盛が 78µs なので、
`2270` と `2300` は同じ duty 29 になります。

#### ⚠ パルス幅は周期を超えられません

周波数を上げると周期が縮むので、µs 範囲がそのままだと入り切らなくなります。
上限 2270µs を保つなら、**周波数の実用上限は約 440Hz** です。

超えた場合は Scratch 側が duty を 255 で頭打ちにし、開発者コンソールへ警告を出します。
黙って頭打ちにすると「出力が振り切ったまま戻らない」という一番わかりにくい
壊れ方になるためです。周波数と µs 範囲を同じブロックにまとめてあるのは、
この 3 つが互いに影響するからです。

なお **`PWMmin` の `Pwm_servo()` は使っていません。** あちらは 500Hz 前提で
角度を duty 128–255（パルス 1.0–2.0ms）に写すため、50Hz では意味が変わります。

#### ⚠ 周波数はピンごとではなくタイマーごと

`Pwm_write()` は呼ばれるたびに `TIMn->PSC` を書き戻します。**最後に周波数を言った者が
勝ちます。** そのため、PWM を出すコマンドは毎回それを持ってきます。

| コマンド | 渡す周波数 |
|---|---|
| `ANALOG_WRITE`（`0x24`） | 1000Hz 固定 |
| `SERVO`（`0x26`） | 設定ブロックの値（既定 50Hz） |

これが無いと、サーボを使ったあとのアナログ出力が 50Hz のままになり、
**LED が目に見えてちらつきます。**

適用するのは**そのピンの属するタイマーだけ**です（`pwmSetFreq()`）。
`Pwm_freq()` は TIM1 と TIM2 の両方を変えてしまうので使いません。
使うと、サーボを D5（TIM1）に出しただけで LED の D2（TIM2）まで 50Hz になります。

**残る制約は消せません。** 同じタイマーのピンでサーボとアナログ出力を同時に使うと、
後から出した方の周波数に揃います。TIM1 は D0 / D5 / D6 / D12 を共有しているためで、
ハードウェアの制約です。実用上は、LED の D2 が TIM2 単独、サーボ向けの
D5 / A1 / A2 / A3 が TIM1 なので、普通の組み合わせではぶつかりません。

#### 動き終わるのを待ちません

`SERVO` はパルス幅を変えたら即座に `OK` を返します。サーボが実際に向きを変えるまで
どれだけかかるかはサーボ次第で、デバイス側からは分かりません。
待たせたいときは Scratch の `[ ] 秒待つ` を続けて置きます。

「サーボをとめる」ブロックは置いていません。止めたいときは
`ピン [ ] を [出力] にする`（`PIN_MODE`）が先に `Pwm_stop()` を呼ぶので、それで代用できます。

### 📏 距離計のブロック（HC-SR04）

```
距離計(HC-SR04)の設定 Echo [3] Trig [4]
距離
```

`距離` は cm を返します。**設定ブロックは置かなくても動きます**（既定は Echo=D3 / Trig=D4）。

```
HC-SR04    UIAPduino
  VCC ───── 5V
  Trig ──── D4 (PC2)
  Echo ──── D3 (PC1)
  GND ───── GND
```

⚠ **`uiap-hid-web` の README の配線例（TRIG→pin3 / ECHO→pin4）とは逆です。**
HC-SR04 のピン並びが `VCC / Trig / Echo / GND` なので、基板の D3 / D4 に対しては
`Echo=D3 / Trig=D4` の方が線が交差しません。実機で扱いやすかった向きに合わせてあります
（2026-08-09）。設定ブロックの引数も、その並びに合わせて Echo を先にしてあります。

**`ピンを出力にする` ブロックは要りません。** 測るたびにデバイス側が
`Trig=OUTPUT` / `Echo=INPUT` にします。設定した時点ではなく測る時点でやっているので、
設定ブロックを置かず既定ピンで使う場合も同じように効きます。

**出荷時の 5V 駆動なら Echo は直結できます。** 3.3V に改造した基板では、標準の
HC-SR04 は 5V 品なので動作が怪しくなります。その場合は HC-SR04P や US-100 など
3.3V で動く製品を使ってください。

#### 型番をレポーター側に書いていない理由

`距離` は毎回使うブロックなので短く保ち、型番は**配線するとき**に見る設定ブロックへ置いています。
単位（cm）もラベルに書いていません。HC-SR04 の実用範囲は 2〜400cm なので、
値を見れば cm であることはすぐ分かります。

`距離` が引数を持たないのは、**パレットにチェックボックスを出すため**です。
距離計は値を見ながら使うものなので、ステージに表示できることが効きます
（理由は「[📺 アナログ値のステージ表示](#-アナログ値のステージ表示)」と同じ）。

#### デバイスが返すのは µs です

`DISTANCE`（`0x27`）が返すのは**往復時間（µs）**で、距離ではありません。
cm への換算（`µs ÷ 58`）は Scratch 側が持っています。サーボと同じ考え方で、
係数を変えたくなったときに基板を焼き直さずに済みます。

音速 340m/s は 29µs/cm ですが、超音波は往復するので 58µs/cm になります。

#### ⚠ `micros()` と `pulseIn()` は使いません

CH32V003 の `micros()` は `millis()` と同じ `uint64_t` の除算を引き込むため、
**これ 1 つで Flash が 2.2KB 増えます。** `pulseIn()` も内部で `micros()` を呼ぶので同じです。

代わりに `SysTick->CNT` を直接読んでいます。`micros()` が内部で使っているのと同じ
free-running カウンタで、`uiap-hid-web` の `UIAPrubyVmUs.ino` が実機で使っている方法です。

```c
uint32_t t0 = SysTick->CNT;        /* 48 ticks = 1µs */
while (digitalRead(echo) && --cnt) {}
uint32_t us = (uint32_t)(SysTick->CNT - t0) / 48;
```

32bit の引き算なので折り返しも安全です（48MHz なら約 89 秒で 1 周。計測は数十 ms）。
待ちの上限は時間ではなく**ループの回数**で数えています。時間で測ろうとすると、
その時計のために `micros()` が要るからです。

#### 測定不能は 0

次のどちらも `0` を返します。区別はしません。

| 状況 | 何が起きているか |
|---|---|
| 反応が返らない | 未接続 / 電源が来ていない / Trig・Echo の取り違え |
| Echo が戻らない | 測定範囲外（遠すぎる・反射が返らない） |

アナログ入力のように直前の値を保つことはしません。**0 が出たら測れていない**、と読めます。

### 📨 シリアル通信のブロック

```
シリアル通信 ボーレート [9600▼] で開始する

シリアル通信 1行書き出す [Hello]
シリアル通信 数値を文字で書き出す [0]
シリアル通信 名前と数値を書き出す [x] = [0]
シリアル通信 文字列を書き出す [Hello]
シリアル通信 複数の数値をカンマくぎりで書き出す [リスト▼]

シリアル通信 1行読み取る
シリアル通信 つぎのいずれかの文字の手前まで読み取る [改行コード▼]
シリアル通信 文字列を読み取る

シリアル通信 つぎのいずれかの文字を受信したとき [改行コード▼]
シリアル通信 [改行コード▼] を受信した
```

**最初に `ボーレートで開始する` を実行してください。** これを置かないと、読み取りの
ブロックは黙って空文字を返します（開発者コンソールには警告が出ます）。
**Xcratch 版ではページを読み込み直すたびに必要です。** 拡張機能が作り直されるので、
開いた状態を忘れます。

```
UIAPduino    相手
  D15 ────── RX
  D16 ────── TX
  GND ────── GND
```

**出荷時の 5V 駆動なので、5V の機器はそのまま繋がります。**

#### デバイスは「行」も「CSV」も知りません

運ぶのはバイト列だけです。区切り文字の判定も CSV の組み立ても Scratch 側にあります。
サーボが角度を知らないのと同じ理由で、**ブロックの書式を変えても基板を焼き直さずに
済みます。**

`つぎのいずれかの文字を受信したとき` はハットブロックです。**待っている間、USB の
往復は一度も起きません。** デバイスが受信を検知した時点で `0x54` を送ってきて、
そこから動き出します。

`1行読み取る` と `文字列を読み取る` は、チェックを入れるとステージに表示できます。
**表示しているだけでは中身は消えません。** ブロックとして実行したときだけ取り出されます
（モニターからの呼び出しかどうかを見て分けています）。

#### ⚠ シリアルを開くと 4 つのピン名が使えなくなります

Tx / Rx は USART1 の固定で、CH32V003 では動かせません。

| | |
|---|---|
| 送信 (Tx) | **D15** = **A5** |
| 受信 (Rx) | **D16** = **A6** |

`開始する` を実行した後だけ弾きます。**シリアルを使わない作品からは取り上げません。**

#### ⚠ 速度の上限

USB-HID を通すので、シリアルの速度がそのまま出るわけではありません。

| | 実測 |
|---|---|
| キーボードとして打ち込む速さ | 約 **25 文字/秒** |
| Scratch へ読み出す速さ | 約 **330 バイト/秒** |

GPS を 9600 baud で繋いで受信文をキーボードで打たせる場合、**2 文を打つ間に次の
7 秒ぶんを取りこぼします。** 連続で全部を記録する用途には足りません。必要な文だけを
選ぶ、間引く、といった作り方をしてください。

受信バッファは 256 バイトです（`UIAPSerial.h` の既定 64 から広げてあります）。
コマンドの実行中はデバイスが占有されるので、その間に届いた分を落とさない深さが要ります。
9600 baud なら 64 バイトは 67ms しか持ちません。

#### ⚠ 記号は日本語配列の PC だと変わります

受け取った文字を**キーボードのブロックで打たせる**場合の話です。デバイスは US 配列の
HID キーコードを送るだけなので、解釈は受け取る PC の配列で決まります。
NMEA のチェックサム `*5C` が `(5C` になります。

**英数字・カンマ・ピリオド・ハイフンは配列によらず正しく入ります。** 座標の値は無事です。
**これは基板では直せません。** 記号を正確に残したいなら、キーボードで打たずに
Scratch のリストへ入れてください。

#### 複数の数値は「リストを選ぶ」形にしています

図にあった「配列 (0)(1) ⊖ ⊕」のような可変長入力は scratch-blocks にありません。
Scratch のリストを選ばせる形にしてあります。

### 💡 NeoPixel のブロック（WS2812B）

```
NeoPixel は 赤が [赤] 緑が [緑] に見える
NeoPixel を [12] 個 明るさ [50] % で始める
NeoPixel の明るさを [50] % にする

NeoPixel の [1] 番を [■] にする
NeoPixel の [1] 番を 赤 [255] 緑 [0] 青 [0] にする
NeoPixel の [1] 番を 色 [0] 鮮やかさ [100] 明るさ [100] にする
NeoPixel の [1] 番から [3] 個を [■] にする
NeoPixel を全部 [■] にする
NeoPixel を消す

NeoPixel を [1] つ ずらす
NeoPixel を [20] % 暗くする
NeoPixel に虹を出す ずらし [0]

NeoPixel を表示する
NeoPixel をまとめて表示する〔 〕
NeoPixel の [1] 番の色
```

**最初に `[ ] 個 明るさ [ ] % で始める` を実行してください。** これを置かないと、色の
ブロックは何もしません。シリアルと同じく、Xcratch 版では読み込み直すたびに必要です。

番号は **1 から**数えます（Scratch のリストと同じ）。範囲外の番号は何も起きません。

```
WS2812B    UIAPduino
  DIN ───── D8 (PC6)
  VCC ───── 5V
  GND ───── GND
```

**DIN は D8 の固定で、変更できません。** 波形を SPI1 の MOSI で作っているためです。

#### 色が入れかわるときは、見えた色を答えてください

テープやリングは、製品によって 1 画素 3 バイトの並びが違います。合わない製品では
色が入れかわりますが、**どの並びなのかを見た目から当てることはできません。**
商品説明の「RGB」も、たいていは「フルカラー」の意味で、並びのことではありません。

そこで、**並びを当てるのではなく、見えた色を答えてもらう**形にしてあります。
まず 2 個だけ光らせてください。

```
NeoPixel を [12] 個 明るさ [50] % で始める
NeoPixel の [1] 番を 赤 [255] 緑 [0] 青 [0] にする
NeoPixel の [2] 番を 赤 [0] 緑 [255] 青 [0] にする
```

**1 番と 2 番が何色に光ったか**を、このブロックにそのまま入れて、
**`始める` の上に置いてください。**

```
NeoPixel は 赤が [1 番に見えた色] 緑が [2 番に見えた色] に見える
```

1 番が赤・2 番が緑に光ったなら、そのまま `赤` `緑` を選びます（既定のままで
合っている、という意味になります）。これで残りの色もそろって直ります。

⚠ **答えるのは「このブロックを置く前」の見え方です。** 直った後の色ではありません。

⚠ **青だけ暗く見えるのは正常です。** WS2812B は素子の光度が青でいちばん低く、
目の感度も青で最も低いためです。故障ではありません。

##### WS2812B が分かる方へ — 答えと送信順の対応

「赤が赤、緑が緑に見える」場合は、**GRB の順にデータを送信しています。**
以下、答えの組み合わせと、そのテープが期待している送信順の対応です。

| 赤が | 緑が | テープの送信順 |
|---|---|---|
| 赤 | 緑 | **GRB**（既定。WS2812B の標準） |
| 青 | 緑 | GBR |
| 緑 | 赤 | RGB |
| 赤 | 青 | BRG |
| 緑 | 青 | BGR |
| 青 | 赤 | RBG |

3 文字は**線に出すバイトの順**（先頭が 1 バイト目）で、`Adafruit_NeoPixel` や
`NeoPixelmin` の `NEO_GRB` などと同じ意味です。ブロックで選んだ結果は、
ファームウェア側で `NeoPixelmin(n, pin, NEO_GBR)` のように指定したのと同じになります。
**並べ替えは Scratch 側で行うので、基板の焼き直しは要りません。**

⚠ この 3 文字は**ライブラリの定数名**です。商品の箱にも通販ページにも通常は
書かれていません。**商品説明の「RGB」はフルカラーの意味**で、送信順のことでは
ありません。ブロックのメニューに略語を出していないのはこのためです。

並べ替えるのは基板へ送る直前だけです。`n 番の色`・虹・HSV・`ずらす`・`暗くする` は
どれも今までどおり動きます。**基板を焼き直す必要はありません。**

#### 色は Scratch 側で決めています

色を決めるブロックは USB を触りません。書き換えるのは拡張機能が持つ**鏡のバッファ**で、
実際に送るのは表示するときだけです。1 コマンドの往復に 12〜15ms かかるので、LED を
1 個ずつ送ると 12 連リングで 180ms かかり、アニメーションになりません。

**虹・回転・減衰・HSV の計算はすべて JS 側です。** デバイス側のコマンドは 5 つしか
ありません（`0x60`–`0x64`）。表現を増やしても基板を焼き直さずに済みます。

送るのは**変わった範囲だけ**です。1 個の書き換えなら 2 往復（約 25〜30ms）で済みます。

#### 自動表示は既定 ON。速さが要るところだけ囲む

色のブロックは、そのつど表示まで行います。**置いただけで光らないと、どこが悪いのか
分からない**ためです。

```
NeoPixel をまとめて表示する〔
    NeoPixel の [1] 番を [赤] にする
    NeoPixel の [2] 番を [青] にする
〕
```

囲みの中では光らず、**抜けた瞬間にまとめて反映されます。** 入れ子にできます。
囲みの途中で停止しても、次に緑の旗を押せば自動表示は戻ります。

停止ボタンを押すと消灯します。

#### `虹を出す` の `ずらし` は 100 で一周

色相の一周を LED の個数に割り当てます。`ずらし` はそれを回す量で、**目盛りは
`色 [ ]`（HSV の色相）と同じ 0〜100**、100 で一周です。

**100 を超えても余りを取ります。** 増え続ける値をそのまま入れて構いません。

```
NeoPixel に虹を出す ずらし ((タイマー) * (20))
```

これで 5 秒に 1 回転します。数を大きくすると速くなります。

#### `明るさ` と `暗くする` は別のものです

| | 効き方 |
|---|---|
| `明るさを [ ] % にする` | 送り出すときに掛かるだけ。**元の色は残るので戻せます** |
| `[ ] % 暗くする` | 色そのものを書き換えます。**繰り返すと消え、戻せません** |

残像やフェードアウトを作るのは後者です。`明るさ` を変えたときは、色を入れ直さなくても
次の表示で反映されます。

#### ⚠ `始める` の個数は、実際の数を入れてください

多めに入れても光り方は変わりません（繋がっていない分のビットはチェーンの末端から
出ていって消えます）。**ただし送出中は割り込みを止めるので、その時間が数に比例します。**

| 個数 | 割り込みを止める時間 |
|---|---|
| 12 | 0.38ms |
| 64 | 2.05ms |

割り込みを止めているのは、止めないと**実機で LED が不規則に光る**ためです。WS2812 は
途中で 50µs 以上止まると、そこで 1 フレームが確定したと見なして次のバイトから別の
フレームとして解釈し直します。UIAPduino の USB はソフトウェア実装（rv003usb）なので、
その割り込みは 50µs を超えます。詳細は
[NeoPixel ブロック 実装仕様](docs/scratch3-uiapduino-neopixel-blocks-spec.md)。

上限は **64 個**です。1m 60 個のテープまで入ります。

#### ⚠ NeoPixel を始めると D8 が使えなくなります

`始める` を実行した後だけ、D8 がピン操作から外れます。使わない作品からは取り上げません。

**D7 (SCK) / D9 (MISO) / D3 (NSS) は空いたままです。** 消費するのは MOSI の 1 本だけです。
アナログ側の禁止はありません。PC6 にアナログチャンネルが無いためです。

**SD カード（`SPI.h` / `SDmin`）とは同時に使えません。** どちらも SPI1 を使います。

#### ⚠ たくさん光らせるときは電源を分けてください

WS2812B は 1 個を白で全開にすると 60mA ほど流れます。**64 個すべてを白 100% にすると
約 3.8A** で、USB からは取れません。

`始める` の明るさの既定を **50%** にしてあるのはこのためです。数を増やすときは明るさを
下げるか、LED 側に別の電源を用意してください。そのときの繋ぎ方は次節と同じで、
**GND だけを共通にし、外部電源を Vcc に繋がないでください。**

### 🔥 スケッチを書き込むブロック（v0.2.4〜）

```
スケッチ (プロトコル 8) を書き込む     … 押すと焼く。成功したら true
書き込みの ようす                     … 「書き込み中 45%」など
```

**Arduino IDE を持っていなくても基板を焼けます。** 使い方は
[書き込み方法](#書き込み方法)を見てください。

パレットの末尾と、**スケッチが噛み合わないときの説明の中**の 2 か所に出ます。
後者が本来の置き場所です。「合いません、書き込み直してください」と言われた画面から、
そのまま直せます。

#### 焼くのは「拡張機能に同梱してあるスケッチ」です

`.bin` は `sketchBin.js` として拡張機能の中にあります。**だから拡張機能とスケッチの版が
ずれません。** 拡張機能が新しくなれば、焼かれるスケッチも必ずその版のものになります。

ブロックの名前に出ている番号（`プロトコル 8`）は、**実際に焼かれるものの番号**です。
拡張機能側の定数ではありません。2 つが食い違っていたら、焼かずに止まります。

#### ⚠ ブロックのクリックからしか焼けません

緑の旗から走らせると「ブロックをクリックしてください」で止まります。
`navigator.hid.requestDevice()` がクリック直後であることを要求するためです。
**事故防止としても都合がよいので、そのままにしてあります。**

デスクトップ版は `getDevices()` で拾えるため、この制限がありません。代わりに
`main/index.js` が `1209:B803`（書き込みモードの基板）を許可している必要があります。

#### 書き込み中に見えるもの

| 状態 | 出る文字 |
|---|---|
| 押す前 | まだ書き込んでいません |
| 基板を探している | 基板をさがしています |
| 書き込み中 | 書き込み中 45% |
| 照合中 | たしかめ中 45% |
| 完了 | 書き込めました |
| 書き込みモードでない | 基板が書き込みモードになっていません |
| 緑の旗から走らせた | ブロックをクリックしてください |

**最初の 1 セクタだけ「たしかめ中 0%」が出るのは正常です。** 書き込み処理は
「差分が見つかったか」で表示を切り替えるので、まっさらな基板でも 1 個目までは
照合中の扱いになります。2 周目は全部「たしかめ中」で終わります。

#### 書き込みの後

基板は再起動して `1209:D004` として現れ直します。**それを見つけたら自動で繋ぎ直します**
（0.5 秒おきに最大 10 秒）。繋がると、説明に差し替わっていたパレットもブロックへ戻ります。

10 秒で現れなければ何もしません。ステータスボタンから繋いでください。

### ⚡ モーターの電源は分ける（Vcc に繋がない）

サーボや DC モータードライバを**強いトルクで動かしたいときは、電源ラインを分けられます。**
モーター側には好きな電圧の電源を与えられます。

このとき、**GND だけを UIAPduino と共通にしてください。**

```
外部電源 (+) ─────────── サーボ / モータードライバの電源
外部電源 (−) ─────┬───── サーボ / モータードライバの GND
                  └───── UIAPduino の GND      ← GND だけ共通にする

UIAPduino の Vcc ────── USB から給電。外部電源は絶対に繋がない
UIAPduino の信号ピン ── サーボの信号線へ
```

GND を共通にするのは信号の基準を合わせるためです。ここが繋がっていないとサーボは動きません。
**繋いではいけないのは `Vcc` だけ**です。

#### ⚠ 間違えても基板は動いてしまいます

外部電源を `Vcc` に繋いでしまった場合、**基板はそのまま動作します。**

普通は配線を間違えれば動かないので気づきます。ここは違います。
**間違えたまま正常に見えるので、気づく機会がありません。**
「動いているから正しい」がここでは通用しません。

USB を PC に挿したまま使う拡張機能である以上、この配線ミスは PC 側にも及びます。
配線したら、通電する前に `Vcc` を目で確かめてください。

#### USB だけで動かす場合

小さなサーボを 1 個ゆっくり動かす程度なら、USB からの給電でも動きます。
ただし SG-90 でも動き始めと停動で 500〜700mA 流れるので、
**足りなくなると電圧が落ち、基板ごと再起動して Scratch との接続が切れます。**

サーボが動かないのではなく接続が切れる、という分かりにくい壊れ方をするので、
複数個を同時に動かすなら最初から電源を分けてください。

### 実機確認の記録

`hid-console.html` から生バイトを送って確認したものです。

| 送信 | 結果 |
|---|---|
| `20` | `52 00 00` — PING（**バージョン照合を入れる前の版**での記録） |
| `21 02 01` | `52 00 00` — D2 を出力に。LED 消灯（出力ラッチが 0 のため。Arduino 標準の挙動） |
| `22 02 01` / `22 02 00` | `52 00 00` — 全点灯 / 消灯 |
| `23 02` | `52 02 01 ...` → `52 03 00 ...` を **100 回連続で取りこぼしなし** |
| `24 02 80` | `52 00 00` — LED が半分の明るさに |
| `24 09 80` | `52 01 00` — PWM 非対応ピンを正しく拒否 |
| `25 00`（5V） | `0x3FF` = 1023 |
| `25 00`（GND） | 1〜2（ADC ノイズフロア） |

⚠ **`24` の 2 行はバージョン 5 以前の記録です。** バージョン 6 で `ANALOG_WRITE` に
周波数が付いたので、今このバイト列を送ると `[3..4]` が 0 になり周波数 0 として
拒否されます。今の版で同じことを試すなら `24 02 80 E8 03` / `24 09 80 E8 03` です。

`0x3FF` が返ることで、`DATA(2)` のリトルエンディアン 16bit が
上位バイトまで届いていることが確認できます（下位だけなら 255 で頭打ちになる）。

`24 02 80` の直後に `21 02 01` → `22 02 01` で全点灯に変わることから、
`PIN_MODE` の `Pwm_stop()` が PWM 中のピンを GPIO に戻せていることも確認済みです。

この記録を取った時点の `0x20` は `RSP_OK` を返す版でした。
バージョン照合を入れた後は `52 02 01 01` → `52 03 00`（バージョン 1）を返します。

**バージョン 6 では `52 02 01 06` → `52 03 00` になります。**

サーボは `hid-console.html` から次を送ると、ブロックを置かずに確かめられます。

| 送信 | 期待する結果 |
|---|---|
**`ANALOG_WRITE` と `SERVO` は 5 バイトです。** `[3..4]` の周波数は uint16LE なので、
50Hz は `32 00`、1000Hz は `E8 03` になります。

| 送信 | 期待する結果 |
|---|---|
| `26 02 06 32 00` | `52 00 00` — D2 に 50Hz・duty 6（0.47ms）。角度 0 相当 |
| `26 02 12 32 00` | `52 00 00` — 50Hz・duty 18（1.41ms）。角度 90 相当 |
| `26 02 1D 32 00` | `52 00 00` — 50Hz・duty 29（2.27ms）。角度 180 相当 |
| `26 09 12 32 00` | `52 01 00` — PWM 非対応ピンを正しく拒否 |
| `26 02 12 00 00` | `52 01 00` — 周波数 0 を正しく拒否 |
| `26 02 12 32 00` → `24 02 80 E8 03` | LED が 1000Hz に戻り、ちらつかずに半分の明るさになる |
| `27 04 03`（20cm 先に壁） | `52 02 02 88 04` → `52 03 00` — `0x0488` = 1160µs ≒ 20cm |
| `27 04 03`（何も無い方向） | `52 02 02 00 00` → `52 03 00` — 0（測定不能） |
| `27 04 0D` | `52 01 00` — Echo に USB ピン (D13) を指定して正しく拒否 |

角度ではなく duty を送る点に注意してください。デバイスは「サーボ」を知りません。

最後の 1 行が、周波数をコマンドごとに渡す仕組みの確認です。
これが効いていないと、サーボを使ったあとの `analogWrite` が 50Hz のままになり、
LED が目に見えてちらつきます。

### レポート消失対策

`uiapwebhid_send` 内蔵の待ちだけでは、ホストのポーリングのばらつきで
前のレポートが上書きされて消えることがあります（uiapruby の `consoleWriteChunk()` に同じ記述あり）。
`DATA` → `END` の 2 レポートでこれが起きると `DATA` が消えて `END` だけが届き、
**Scratch 側はセンサー値 0 を正常値として受け取ってしまいます。**

- スケッチ側: 送信前に `WebHID.busy()` が下りるまで待つ
- Scratch 側: `DATA` を伴わない `END` はエラーとして reject する

の両方で塞いであります。

---

## 🚀 ビルド方法（Windows / PowerShell）

```powershell
mkdir scratch3-uiapduino-build
cd scratch3-uiapduino-build

curl -o build-scratch3-uiapduino.ps1 https://raw.githubusercontent.com/tarosay/scratch3-uiapduino/master/build-scratch3-uiapduino.ps1
./build-scratch3-uiapduino.ps1
```

**空のディレクトリで実行してください。** このリポジトリの中では実行できません
（`scratch-vm` などが既に存在するため停止します）。

成果物:

```
scratch-desktop/dist/
  Scratch-UIAPduino-3.29.1-Setup.exe        … インストーラ (約 163 MB)
  Scratch-UIAPduino-3.29.1-portable.zip     … インストール不要版 (約 190 MB)
  Scratch-UIAPduino-3.29.1-sketch.zip       … デバイス側スケッチ (約 10 KB)
  win-ia32-unpacked/                        … インストール不要版の中身 (約 341 MB)
    Scratch UIAPduino.exe
    resources/  locales/  *.dll  ...
```

`sketch.zip` には `ScratchUiapduino/` フォルダごと（`.ino` と `sketch.yaml`）が入ります。
Arduino IDE は `.ino` と同じ名前のフォルダに入っていることを要求するためです。

**この zip はビルドのたびに作り直されます。** 以前は手作業だったので、`.ino` を
変えても古い zip が残り続けていました。ビルド時に `.ino` から `PROTOCOL_VERSION` を
読んで表示するので、基板に焼くべき版が取り違いなく分かります。

```
>>> dist\Scratch-UIAPduino-3.29.1-sketch.zip (protocol 5)
```

ディレクトリ名は `win-unpacked` ではなく **`win-ia32-unpacked`** です。
ビルドスクリプトが `nsis:ia32` を指定しているため、
electron-builder がアーキテクチャ名付きのディレクトリを作ります。

**インストール不要版は `.exe` 単体では動きません。**
`Scratch UIAPduino.exe` は Electron の実行ファイルで、
アプリ本体は `resources/app.asar` にあります。
Chromium の DLL や言語ファイルも必要なので、フォルダごと扱ってください。

### 公式 Scratch Desktop との共存

上流の `electron-builder.yaml` は `appId` も `productName` も公式と同じです。
そのままビルドすると、公式 Scratch Desktop を入れている人が
インストールしたときに**同じアプリとみなされて上書きされます。**

ビルドスクリプトが clone 後に以下を差し替えて、共存できるようにしています。

| | 上流 | このビルド |
|---|---|---|
| `appId` | `edu.mit.scratch.scratch-desktop` | `jp.uiap.scratch-uiapduino` |
| `productName` | `Scratch 3` | `Scratch UIAPduino` |
| `nsis.artifactName` | `Scratch ${version} Setup.${ext}` | `Scratch-UIAPduino-${version}-Setup.${ext}` |

`artifactName` は `productName` を参照せず `Scratch` が直書きされているため、
ここも変えないとインストーラのファイル名が変わりません。

さらに `scratch-desktop/src/main/index.js` で `app.setName()` を呼び、
ユーザデータの保存先を `%APPDATA%\Scratch UIAPduino` に分けています。
これが無いと公式と同じ `%APPDATA%\Scratch` を共有します。

`version` は上流の `3.29.1` のままです。土台にした scratch-desktop の版を表します。

### 動作確認済み環境

```
Node.js : v16.20.0
npm     : 8.19.4
Electron: 15.3.1
```

npm v7 以降は peerDependencies が厳格なため `react-responsive@5.x` が
インストールエラーになります。`react-responsive@4.1.0` を強制指定して解決しています。

### 既知のハマりどころ

- **シンボリックリンク**: 開発者モード OFF・非管理者では `New-Item -ItemType SymbolicLink`
  が失敗します。ビルドスクリプトはジャンクションを使うので管理者権限は不要です。
- **AppX ビルド**: `npm run build` は AppX（Microsoft Store 用）を先にビルドしますが、
  Windows SDK の `makeappx.exe` が無いと失敗し、NSIS インストーラまで到達しません。
  ビルドスクリプトは `electron-builder` を直接呼んで NSIS だけを作ります。
- **PowerShell の文字コード**: 日本語コメントを含む `.ps1` は **UTF-8 BOM 付き**で
  保存してください。BOM が無いと PowerShell 5.1 が cp932 として読み、構文エラーになります。
- **PowerShell のバージョン**: Windows PowerShell 5.1 と PowerShell 7 のどちらでも動きます。
  ジャンクションの作成だけは 7 が `-Target` に絶対パスを要求するため、
  スクリプトは絶対パスを渡しています（5.1 は相対パスでも通るので、5.1 だけで試すと
  この違いに気づけません）。
- **コア数の多い機械での Terser クラッシュ**（ビルドスクリプトが対処済み）:
  素の状態では 92% の Terser で
  `spawn UNKNOWN` / `node_platform.cc:61: Assertion (0) == (uv_thread_create(...)) failed`
  となってビルドが落ちます。原因は electron-webpack の `out/targets/BaseTarget.js` で

  ```js
  if (configurator.env.minify !== false) { optimization.minimizer = [...]; }
  optimization.minimize = true;   // ← 条件の外
  ```

  となっているため、`compile` が渡している `--env.minify=false` が効かず、
  webpack 4 の既定 minimizer（TerserPlugin, `parallel: true`）が動くことです。
  `parallel: true` は `os.cpus().length - 1` 個のワーカープロセスを起こすので、
  64 コアなら 63 プロセスとなりスレッド生成に失敗します。

  `build-scratch3-uiapduino.ps1` が clone 後に
  `scratch-desktop/webpack.makeConfig.js` へ以下を挿入して回避します。
  `cache` / `sourceMap` は webpack 4 の既定と同じ値なので、**成果物は変わりません。**

  ```js
  config.optimization = Object.assign({}, config.optimization, {
      minimizer: [new (require('terser-webpack-plugin'))({
          cache: true, parallel: 4, sourceMap: true
      })]
  });
  ```

  パッチは冪等で、挿入位置が見つからない場合はビルドを中断します
  （上流が変わったことに気づかず素通りしないため）。

---

## 🔗 関連

- [tarosay/scratch3-tello](https://github.com/tarosay/scratch3-tello) — 同じ構成の Tello 拡張
- [tarosay/uiap-hid-web](https://github.com/tarosay/uiap-hid-web) — UIAPduino の WebHID 実験サイト

### Tello 拡張との共存について

両者とも `extension-manager.js` と `scratch-gui` の `index.jsx` の同じ箇所を
上書きします。1 つのアプリに Tello と UIAPduino の両方を載せる場合は、
オーバーレイを単純にコピーするのではなくマージが必要です。

---

## License

このリポジトリには**著作権者の異なるものが混在**しています。

### tarosay の成果物

ルートの [`LICENSE`](LICENSE)（BSD-3-Clause / Copyright (c) 2026, tarosay）が適用されます。
対象は「🆕 新規ファイル」の表に挙げたものです。

- `scratch-vm/src/extensions/scratch3_uiapduino/` 以下（**`rv003usbFlasher.js` を除く**。下記）
- `scratch-gui/src/lib/libraries/extensions/uiapduino/` 以下
- `sketches/` 以下
- `build-scratch3-uiapduino.ps1`
- `README.md`

### 同梱している第三者のコード（MIT）

`scratch-vm/src/extensions/scratch3_uiapduino/rv003usbFlasher.js` は、
書き込みブロックが使う rv003usb ブートローダへの書き込み処理です。**MIT License。**

出どころは
<https://yuukiumeta-uiap.github.io/rv003usb-webflasher/rv003usb_webflasher.js>、
`minichlink` からの移植です。

```
Copyright (c) 2026 Wong Cho Ching <https://sadale.net>
Copyright (c) 2023-2024 CNLohr <lohr85@gmail.com>, et. al.
Copyright (c) 2021 Nanjing Qinheng Microelectronics Co., Ltd.
Copyright (c) 2023-2024 E. Brombaugh
Copyright (c) 2023-2024 A. Mandera
Copyright (c) 2005-2020 Rich Felker, et al.
Copyright (c) 2013,2014 Michal Ludvig <michal@logix.cz>
```

ライセンス全文はファイルの冒頭にそのまま残してあります。
**変更は 3 点だけで、その内容も冒頭に書いてあります**（デバイスを引数で受け取れるように、
`export default` の追加、strict mode で落ちる暗黙のグローバルの宣言）。
上流が更新されたときに差分を当て直せるよう、整形はしていません。

### 上流 Scratch のコード

「✏️ 上流ファイルへのパッチ」の 3 ファイルは、Scratch のコードを改変したものです。
著作権は元の権利者に帰属し、それぞれの上流リポジトリのライセンスに従います。

| 上流 | 著作権表示 |
|---|---|
| scratch-vm | Copyright (c) 2016, Massachusetts Institute of Technology |
| scratch-gui | Copyright (c) 2016, Massachusetts Institute of Technology |
| scratch-desktop | Copyright (c) 2019, Scratch Foundation |

いずれも BSD-3-Clause です。**このリポジトリは上流の `LICENSE` ファイルを含みません。**
オーバーレイ後も clone した各リポジトリの `LICENSE` がそのまま残り、
上記の著作権表示が保持されます。

### プロトコル仕様

ワイヤフォーマットは [tarosay/uiap-hid-web](https://github.com/tarosay/uiap-hid-web) の
`uiapruby.html` および `arduino_core_ch32` の `Hid` ライブラリが持つ既存の契約に合わせたものです。

### ビルド成果物

ビルドして得られる Scratch アプリには上流 Scratch のコードが大量に含まれます。
**配布する場合は上流各プロジェクトのライセンス条項に従ってください。**
