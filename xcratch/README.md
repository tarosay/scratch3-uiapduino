# UIAPduino for Xcratch

[Xcratch](https://xcratch.github.io/) に読み込ませる拡張機能モジュールを作る場所。

デスクトップ版（`scratch-desktop`）とは**ブロックの実装を共有している**。実体は
`scratch-vm/src/extensions/scratch3_uiapduino/` の 2 ファイルで、ここにあるのは
Xcratch 固有のもの（拡張機能一覧に出す情報とビルド設定）だけ。

```
xcratch/
  package.json                                 extensionId と依存
  scripts/setup-dev.mjs                        scratch-vm へのリンクを張る（最初に一度）
  scripts/sync-block.mjs                       本体を複製する（ビルドのたびに自動）
  scripts/rollup.config.mjs                    entry と本体を 1 枚の .mjs にまとめる
  scripts/publish-docs.mjs                     成果物を docs/ へ置く（ビルドのたびに自動）
  src/gui/lib/libraries/extensions/entry/      一覧のカード（名前・説明・アイコン）
  src/vm/extension-support  -> scratch-vm      setup-dev が張るリンク
  src/vm/util               -> scratch-vm      setup-dev が張るリンク
  src/vm/extensions/block                      本体の複製。触らないこと
  dist/uiapduino.mjs                           中間成果物。追跡しない

../docs/uiapduino.mjs                          配るのはこれ（GitHub Pages の公開元）
```

## 公開 URL

```
https://tarosay.github.io/scratch3-uiapduino/uiapduino.mjs
```

**この URL は公開したら二度と変えられない。** Xcratch はプロジェクトにこの URL を書き込み、
次に開くときここから読み直す。変えると、変える前に保存された作品が開けなくなる。

だから URL には「それが何か」しか入れていない。`xcratch/` や `dist/` といった
**ビルドの都合を入れると、そのディレクトリ名を永久に変えられなくなる。**
`docs/` を挟んであるのはそのためで、中の構成をどう変えても URL は動かない。
リポジトリを分けることになっても、成果物をこの置き場へ持ってくれば URL は無事。

GitHub Pages の公開元は **main ブランチの `/docs`** に設定すること。

将来の変種（I2C 版など）は横に並べる。`uiapduino-i2c.mjs` のように。
そのとき `extensionId` も必ず別にすること（同じにすると片方のプロジェクトが
もう片方を掴む）。

**`src/vm/extensions/block` は複製です。直すのは `scratch-vm/src/extensions/scratch3_uiapduino/`
の方。** `npm run build` のたびに `prebuild` が複製し直すので、直したらビルドするだけでよい。
複製は追跡していないので、間違えて触っても次のビルドで消えます。

リンクではなく複製にしているのは、rollup がリンクを実体パスへ解決してしまい、本体の中の
`../../util/cast` がこのリポジトリ側を指して解決できなくなるためです（`preserveSymlinks` を
立てても変わりませんでした）。詳細は `scripts/sync-block.mjs` のコメントに書いてあります。

## バージョン

`package.json` の `version` は**リポジトリのタグと同じ値にすること。** 同じ機能を配って
いるのに番号が違うと、利用者はどちらが新しいのか判断できない。

この値は一覧のカードに `(v0.2.2)` として出るほか、`entry` の説明文にも入る。
リポジトリに新しいタグを打つときは、ここも一緒に上げてビルドし直す。

**ビルドし直すまで反映されない。** rollup が `package.json` の値を読んで
`docs/uiapduino.mjs` に焼き込むので、番号を書き換えただけで push しても、
配られるモジュールは前の版を名乗り続ける。

## ビルド

**Node.js のバージョンがデスクトップ版と違う。** デスクトップ版は v16（webpack 4 の都合）、
こちらは v20 以降（rollup 4 の都合）。`nvm use` で切り替えること。

```powershell
nvm use 20.20.2
cd xcratch
npm install
npm run setup-dev -- ../../scratch3-uiapduino-build/scratch-vm
npm run build
```

`nvm use` を忘れると、入れ子で走る `prebuild` が v16 の node を拾って警告を出します
（今のところ動きはしますが、揃えておくこと）。

`npm run build` は 3 段構えになっている。

| | すること |
|---|---|
| `prebuild` | 本体を `scratch-vm/` から `src/vm/extensions/block/` へ複製 |
| `build` | rollup で `dist/uiapduino.mjs` を作る |
| `postbuild` | それを `../docs/` へ置く（＝公開される場所） |

**試しにビルドしただけでも `docs/` は更新される。** 毎回コピーしているのは
「ビルドしたのに公開し忘れる」を防ぐため。忘れると古いものが配られ続け、しかも黙って起きる。
公開したくない変更はコミットしないこと。`git status` を見れば、ずれているかは分かる。

`setup-dev.mjs` の引数は scratch-vm の場所。`ArgumentType` / `BlockType` / `Cast` を
そこから借りるだけなので、`build-scratch3-uiapduino.ps1` が clone したものをそのまま指せる。
省略すると `../scratch-vm` を見る。

Windows ではリンクにジャンクションを使うので、開発者モードも管理者権限も要らない。

## 動作確認

**Chrome か Edge を使うこと。Firefox には WebHID が無い。** Firefox で開くと拡張は追加できて
ブロックも並ぶが、接続だけができず、モーダルは「デバイスが見つかりませんでした」としか言わない
（本当の理由 `WebHID is not available in this environment` は console にしか出ない）。
2026-08-07 に実際に踏んだ。

**Linux では udev ルールの追加が要る。** 無いとブラウザがデバイスを開けない。
`d004`（通常）と `b803`（書き込みモード）の 2 組が要る。手順は
[`../README.md` の「Linux で使うとき」](../README.md#-linux-で使うとき)。

手元で配るには live-server を CORS 付きで立てる。

```powershell
npx --yes live-server "D:\git\github\scratch3-uiapduino\xcratch\dist" --host=127.0.0.1 --port=5500 --cors --no-browser
```

**配信するのは `dist` だけにすること。絶対パスで渡すこと。** 理由は 2 つあり、
どちらも実際に踏んでいる（2026-08-08）。

**1. `.` を渡すとカレントディレクトリを配ってしまう。** `xcratch/` へ移動し忘れて
ホームディレクトリで実行すると、`C:\Users\<名前>` 以下が丸ごと配信・監視対象になる。
`Change detected AppData\...` が延々と流れ続けるのですぐ分かる。
**しかもこのとき `--cors` が効いている。** `Access-Control-Allow-Origin: *` を返すので、
閲覧中の任意のサイトのスクリプトから `http://127.0.0.1:5500/AppData/...` が読める。
ローカル宛てだから安全、ではない。

**2. `xcratch/` を配ると `node_modules` まで監視する。** 正しいディレクトリで
実行していても数万ファイルを抱えることになる。`dist` なら 2 ファイルで済む。

1. [Xcratch エディタ](https://xcratch.github.io/editor/) を開く
2. 「拡張機能を追加」→「Extension Loader」
3. `http://127.0.0.1:5500/uiapduino.mjs` を入れる

`?extension=` に URL を渡せば 2〜3 を省ける。確認のたびに使うのはこちらが早い。

```
https://xcratch.github.io/editor/?extension=http://127.0.0.1:5500/uiapduino.mjs
```

`dist` をルートにして配るので、URL に `/dist` は付かない。

**HTTPS は要らない。** Xcratch は HTTPS のページなので、そこから `http://` を読むのは
本来なら混在コンテンツで弾かれる。ただし `http://localhost` と `http://127.0.0.1` は
Chrome / Edge が「安全なオリジン」として扱うため、この 2 つだけは例外的に読める。
証明書も mkcert も要らない。

**`file://` では読み込めない。** live-server なしで済ませることはできない。

⚠ 上の例外が効くのは `localhost` と `127.0.0.1` だけ。同じ手元の PC でも、
LAN の IP（`192.168.x.x` など）で配ると混在コンテンツで弾かれる。
別の端末から確認したいときは、そこだけ HTTPS が要る。

## デスクトップ版との違い

| | デスクトップ版 | Xcratch 版 |
|---|---|---|
| WebHID の許可 | Electron の main プロセスが与える | ブラウザが利用者に尋ねる |
| 接続モーダルのバッジ | USB の絵（scratch-gui を改造） | Bluetooth の絵のまま（GUI を触れない） |
| 抜線時の押しっぱなし解除 | main プロセスが後始末する | 仕組みが無い（ページから OS の状態は戻せない）。**実機では問題にならなかった** |
| ブロックの訳文 | 拡張が自前で持つ表 | 同じ（`formatMessage` は Xcratch のものに差し替わる） |
