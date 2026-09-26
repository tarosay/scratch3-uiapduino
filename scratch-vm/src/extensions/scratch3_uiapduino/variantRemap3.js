// scratch3-uiapduino / variantRemap3.js
// Created by tarosay (2026)
//
// 版ごとに違う値だけを集めたファイル。これは Remap3 版 (Tools → PWM = TIM2 Remap3)。
//
// 仕組みと約束は variant.js の冒頭を読むこと。
// Xcratch 版のビルドでは sync-block.mjs がこれを variant.js という名前で置く。
//
// HID 版との違いは PWM を出せるピンだけ。機能は全部同じで、キーボード・マウス・
// シリアル通信・NeoPixel・距離計もそのまま使える。
//
//   HID 版     TIM1 = D0 / D5 / D6 / D12   TIM2 = D2                      5 本
//   Remap3 版  TIM1 = D0 / D5 / D6 / D12   TIM2 = D3 / D9 / D15 / D16     8 本
//
// ⚠ Remap3 版では D2 (オンボード LED) が PWM を出せない。点灯と消灯だけになる。

// 同梱する .bin。embed-bin.mjs の生成物で、手で書かない。
export {
    SKETCH_BIN_BASE64, SKETCH_BIN_SIZE, SKETCH_BIN_PROTOCOL_VERSION
} from './sketchBinRemap3';

/**
 * この拡張機能が相手にするスケッチの版。
 *
 * sketches/ScratchUiapduino を Tools → PWM = TIM2 Remap3 でビルドすると 1 を名乗る。
 * @type {number}
 */
export const SKETCH_VARIANT = 1;

/**
 * 拡張機能 ID。HID 版と必ず別の値にすること (variant.js を参照)。
 * @type {string}
 */
export const EXTENSION_ID = 'uiapduinoRemap3';

/**
 * Xcratch にモジュールとして読み込ませたときの、このモジュール自身の URL。
 *
 * ⚠ 公開したら二度と変えられない。まだ公開していないので、
 *   名前が決まったら公開する前にここを直すこと。
 *   xcratch/src/gui/.../entry-remap3/index.jsx の extensionURL と必ず同じ値にすること。
 * @type {string}
 */
export const EXTENSION_URL = 'https://tarosay.github.io/scratch3-uiapduino/uiapduino-remap3.mjs';

/**
 * パレットのカテゴリ名。HID 版と並べたときに見分けられるようにする。
 * @type {string}
 */
export const EXTENSION_NAME = 'UIAPduino Remap3';

/**
 * ブロックの色 [本体, 入力欄・メニュー, 枠線]。getInfo() の color1 / color2 / color3 になる。
 *
 * HID 版 (既定の緑) と並べたときに、パレットでもスクリプトでも見分けられるようにする。
 *
 * 本体の #3F51B5 は tarosay さんの指定。残りの 2 つはそこから作った。
 * 既定の緑 (#0FBD8C → #0DA57A → #0B8E69) と同じ比率で暗くしてある
 * (RGB をそれぞれ約 0.875 倍と 0.75 倍)。
 * @type {?Array<string>}
 */
export const EXTENSION_COLORS = ['#3F51B5', '#37479E', '#2F3D88'];

/**
 * ブロックパレットのカテゴリ一覧に出す絵 (data URI)。
 *
 * ブロックの色を変えても、ここは変わらない。一覧に出るのは色ではなく絵だから
 * (scratch-vm の runtime.js: menuIconURI → blockIconURI → どちらも無ければ色の丸)。
 * HID 版と並べたときに一覧でも見分けられるように、Remap3 版だけ別の絵にしてある。
 *
 * 実体は scratch-gui 側の
 * src/lib/libraries/extensions/uiapduino/uiapduino-remap3-menu.png (80x80, 背景透明)。
 * 作り方: uiapduino-small.png の灰色の線を #3F51B5 に塗り替え (白い塗りはそのまま)、
 * 62x62 に縮めて、#3F51B5 で塗りつぶした直径 80 の丸の中央に載せた。
 * 画像を差し替えたら base64 も入れ直すこと。
 * @type {?string}
 */
// eslint-disable-next-line max-len
export const MENU_ICON_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAXzklEQVR4nO2deXQc1Zn2f7eqeler1S2pW5JlW0he5EVeMLZjGzBrEnDCAEmYEBhykhwYSAiZSSAkwMxkEs7HEjJ8zARIhgQmGRhIMrEJCSZmSWw2s9h4w4u8CGuXtffeXd1Vd/6o7pbkYLttZLAhzznSkapbt+596nnXW10SnCBYfsnT8mjev27VCnG85nI0+EAmcbRkFYsPgtT37YTHi7RD4f0i87if5P0m7mAcbyKP2+AfNHEH43gROe6DnmjEHYzxJnLcBjvRiTsY40WkMh6DnGzkwfjN+T0TeDKSl8d4zP2YZXwyE/duOFaTPiYFftjIg2Nf01ET+GEkL49jWdtREfhhJi+Po11j0QR+FMjL42jWWhSBHyXy8ih2zeOSB36UcUQCP4rqy6OYtR+WwI8yeXkciYNDEvhX8kZwOC7egw881JgfLd7flcDi1PfulY8QwvrKvy7zx49pficMDsWJdqwDSgmqCgIFE1mg0zQlY1QoRt4/GgKBUPLvL4zKB7RNc8z4CwUeTn15VWUNyfR6H9KU9A0mCUd0hsIpwlGdhXMr+NZ1TUyb4kNRBJomKPFolJbYsGlKgUiJPIg8UISCpgoUMfZ8JwrejZujUqBEYrepBCscbHw7ymlz/UyocpPNWuPGEibhuMEPH9hFLKaTMbIIJKcvCvHx5TU8uaaVltYoNk2lOuiistzJvtYoQ8M6qiIwpcQ0xp4PQFEEQoBhWEdPJIy5xIdVn7DM0KYplPlKqAqp3HXLQn73bCttHXHOPaOGBXMqiMZ0Xnmjl5b2CBV+B1kD9u2P8ty6LqJxE5dLI52GWY3lLJwb4OXX2+jsiaEIhSn1Xs5YWMWrG3tp3hvGblcwDVk0ZSL3XQqZ4/n4uITRra+iFZg3vamnlPL8Swe44eol/Hb1fn63ppUbvjKL+x7azrVXNbJ0YYjegRStHXGi0SxfvnwaV1zq5Eufn8rGrf1Eojozp/lJpw3+uLaT4YhOwF+ClCqptIt97Sa9/RniiQyJpMDpVLn84nr8PjtP/O4d4vEsqipQVUilzbFzzH8vMC4s9SIxDnLN44UCgUeOvNbV/OxFp7B+0yDxeJaaKg8el42hcJpM1sTt0ti1N8zPHmvmwbuX8taWAb53z1vcf8dS9rSEWbW6Fb/PTm9/ihuva2LZohDvtEV5e9cQ1UE3DXVenvlzB719dhrqqtFUG9GEyYZtCXoO9NHTm0LXdUpKNC69oI7pDWU88WQLvQNJNE0lFHSCCT19SbIZE8TBQcqCwLoAUoLxLq8fCcsveVrmVXgUPlCgKoLd+4aZMaWUmdP8TJrgwaYJXnztAF/83FTmN5UTT2ZZcV4tT6xqIRLLcGpTOQBPrWmjOuTmzltPY8WVz/KxUyuZOd3P7fduprrKzcBQmhXnTeQLlzRw+cUNrH6hnVg8yzmnVxON6jz5xzZcziBOp0Y2C1t2DLJy9dskkgaqqiKEwfymANVBwZ9e7iKSMbDbVObO9FNW6uC1t3qJxjIoikBKSdZ4txUevUgLtlxM7qepAj1rsnxJDd+/aT66buBwqIXXs1lpvSdj8tqmXpCweH4Qu11h7zthfvGbvcTiGbweOzd9tYme3gTX37qen/3oDNat7+LZdV08/G9ncM9PttHRGWfZohBr1/fwvRvnUxNy8/Tz7WzdPkhtjYdPnD2Bva0RUkmj4OkGhtKsfqGdHXti2G02XC47jVPLKS1ReH1jO9FYGoEgFHRxyScn092bYM26TgRijFLz/v5wGKPAYss2iWQ4kkbNJT9SQCZrWm5HgqoKJKBpgjMXVwFgGBIhYGq9j9v+YR6tHTFqQm68JTa8nlK++fez+ZcfbsQwJH9/5XQ0TUERCuUBB4tPDfLYyn0c6E3SfSDBPQ9u4yd3L+W/nthDR0+C7359Dhu29PPo/+5FKILPfbqOn9y9jP7BFOFwhuFoGpumsmZtBx6XRpnPidfjQlE1XtoQo7cvSjSaIZHMsnBekPpJJbz4Wg+GKRHCUuqhkDfjo0ykBTZVQwiLFKSlShAYhrR8So6wbNbElKAqgnA0QzptEPA7mN7gAyzfZJqST55dy/lnTgByF0DC178yk4ce3cVd92/h8ovrmd9UTntXnIa6UjZvHySVMqgoV8hkTO55YBuf+VQdSxYGue7br/KTu5dht6vc97PNmFJyyqRSbvjKLLwlNiLRNBu3DeDz2unqSbD21QzT66vx+5z0D2X48/oBTm0KsmFzD0qRRW5RBCoCTAkL5lTwxuYwad3M0WlBSkt1B5Ot6yaqKvjNUy2sfbWHCdVuKgJOzl9ew7xZ5SiKwDStPA9k4SK4nCrfuHpWYSTDkEys8XDLDXP5w/NtzJtdziUX1mGzKXzq/Im88FIXW7YPUu534HKq/G5NG+GIzhM/PZurv/Uyjz+5jys/M4Xv37uFVMpA0xQ+/fGJ/Oh7iwB48fUedu8NUxO0s/KP3Vx4Tg2btg0yMJQeHwKFIsCQnLG4irYuk2C5yyJWEUhpJbktbVEeeGQnoUoXkyd6mDnVz+xGPwA7dg+zbecQLW1RBgZTTKnzYrepPPXHNm64eibOnB/NKzDvg0QuiqqqpfD6yV5u+EqO2Jx1feHSBmZM8zMwlGLWND+BMgefPn8ibR0xrrnxFaSA886sIZHMsqN5iDtvW0hLa5RHHt/NmYuruO+h7TS3DHPOshoO9KU4a7Gf3S06ivoXNBw7gXkH+8KLnWia4IJzJxRUJ7H8RW9fij0tEd7aNoCeMQlVOLn5+jnMbyonpRuUem2UltjQVEH95FI6uuPs2R9Gz5jc8e9bWHxqkMHhFMsWVtHZHWdWYxmmCT6vHUWRaJqCYVhmL7ESepG7iAvmlI+Za0XAyXe/Ppf+oRRejw1viQ0p4aavzuHBX+xCTxtc9bkp2O0KkVgGn9fOrEY/v13dykWfmMQza5vxlVBUB0QUG0CEgGTS4JS6AI/9eGnu2MgJpJRE4xm2bB/kP36+g+Z9YRbNq+T/376Ya258hTc391NaYiORzPL0ox+nfrIXaUp6B1LccscGLvubelY/386lF9bxh+faaJoRoK0jRt2kEqqDbs49o4ZsVqIoFExfCCv+mqYcs1aJ5Xby8zNNq9khckW2YUrU3M/hqM5Djzaza+8wnzirlqqgi2/+62bKvJDJjE3U3w1HVYkIRYI0QIA0GROlTFNiGpIStw3DkNg0hWClkxK3jdu+MZfhaIZINENbZxSPW+O1t/oo99t56NHdtHXEWfn0fiIRnaefb8fhUOntT+Ivc9C8N0JZqQMprcBkt6sFi5DS8p15HwpW5LR+yxGb99QiT7RAEZZLAEvhN17XVFjHD+/fxrKFIQYHI7R1xsePQI9bQyDIZrPWpASjJm+p4h//+XXauqyT2u0KgTJr4Zu2DxKJ6kyo9nDZp+txOlXWvtJFT2+SjdsGwITNbw/isCt0dCdwOtVCMJEm+MvsfEpMxOlUC2qz0ozRVmD9bvnlnB/NE5p7j/X62Bwv7xZsNoVwNMPvn2vjhqvn8aeXkkXxUjSByxYGGQir7NnTPeroWBNWNSU3KdPquITcCAHlfgfRaIZ1r3RTXuZkWr2XQJkDb4md3S1h4gmDEruGYZoIIdB1q0zQdROQ/P7Zdsr9DubPrmB2Y1mBvNHk5AmSyEJibHVxRl5X1Vy7oSBKUXAJUoKRNRkYTNPbFyGRzBbFS9EtfU1T0DQbc2dVFKKjlLJgxkII7rjlNC676BQisQx2m0L9JC/tnXE2bu1HCDh1TgVTTvGS1k3cbhsd3XEi0SyaJjBMk7yK8l1tTbOIqKxw0D+YLoxjpTsWefl8Eix1KcLKCvKWYV1QiVGYr0V8vqSTkoKqDcPE53Px3IudHOhLFcdLsQS+/lYfmayTu2+bmSOMAnHhaAbDMAlWOHHYLbOz2RUqyp2U+x3MmFLG283DbN05yMJ5FYSjGdq7YkSjOoqSvwh/GfFkzhZNwzpPddAF72KWqioYHE6zadsAFeUu6iaWYLcpuJwj6RESTJkPNqJwXMoRkzZNiabZGBhM5y7iOBEoBAwOpzBMSSDgGnMc4Ke/3Mkvf72X6VN8pNNWyqIqgonVHlraokyaUMLC+ZXYNIWKgJMNW/tpagzQfSBJKm1Satcwc+Y7OjAJBIZhjef32bHZlJy6gFwEVlVBb3+S629ZTzptMKHKQySWwePRqAw48ZXamd3oZ/mSKtwuDcOQBVMerVwAoQqEUCz1SkExnciiCDQMcmWZ5ZOsk4pcwitpqCvl9MVBYnGDRDJLJKrjdtlwOBR+8es9rHqmleqQmwq/g/93y2nEYhlaWqMMDqcsxcr8IuSYwJBXi1AEesbAV2q3jitWbM1H1T+90k00luH+O5ZSP9lLR1ecju44nT0J2rviPLZyL+vWd3PrN+ZR4tFyihsJRnkiO7vjhCo9OGwq7V1HjsBFE1jms1Pq0djzTnRU+WYpQAjBZ1bUccE5tURjGSJRnd7+FB6PjUiuUA9VutAUwXBER9dN2rviJFIZdN1EIq1SESW3qJGcTuT8lMOm4HHbKHFrBZ+nKALDtIjv60/hK3VQP9lLNiuprfFQW+MpzL+9K87l165lx55hFs+vxDDkKAEUrhR/eK6d6VPLqfDpRRNYVBCpDro498yJxBMZbJrlV0abm2lKXE6NUKWLqfU+li0KMW9WgHBEp7U9hpQSwzQJVbjwee0sXRikqtJNJiNRhCCWyJDWs6TSJoYhyWYtc0ZKnA4Vt0sjEtURishtVFlmpuai5+BwGrtdwSgQK8lkTHTdJJs1UYTAZhNj0peRQDiSz776Zi8Om8wFtOJQlAKllLT3ZDjnjBpKSmyjemcjOdfoaiDvZ4QiCPgdGCZ09SQIVpiUeDQm1XqY3uBjQrWbBx7ZxZR6L/v2R3DaNYbCaUAwHNax2wWptEEma+JyqlSWu9i1N0wma1Lud1BaYqPEY2MorFMRcKAqAsPIdYHUkfw0kcxiGBKf1zZmXflILaW1DptNYfe+HgJl9vElsL0rzo69SW77xoxc+2oEZi7zH8m3JIpiOfuakJs7b13Igb4kXQcSeNwapaX2ggkumFPBzGk+Lr6gjl8/1ULjlDJ6+pLE4hnKfHZ27wtTGXDx8bNqEEKQTGa5/d5N9PanCAVdBHwObryuiRKPxradQ8TiWUo8Ggf3ASKxDL5SOx7PyHJHN1DzVux22XmnNUx3T/FdPm3dqhVHrId13SQazeBxWQOvfbWbzp4EZy2tYkKVZyTDN0fqTdOUIKAq6KIq6GLurMCYiRumxO3S+NZ1TaTSJl+8bBrRuM6s6WVs2znE3NmWC7jmyunUTfQCMDCYprMnQTSWoXfACkBdPQmu/WIj3719A9fc9ApVlU6qQ26qQy4mTShheoOPVc/sx+3SKHFbChypZEaVfwKEoqJnTDS1OBMuuqGq5DJ2l0vjqTVtPP5kC6cvDHLz7Rv49tfmMGeGnzc29bN2fTfVlS4uPHciAb8DRcDgsE46bVAdcpE1ZGEsANWh4rSrIKAm5MIwASSL5lcipaXgqkp3wVc5HCqfPLuW7p4ksWTGSosqnNRWeXj43jNo3hdm7zthOnqSbNs5xPoNfei6weBwms+sqCNQ5igEkHwZKiWoOTIVoeJ22Y7czx+FogjUswZp3SAS0xkOp5GmZNniEC+/cYDtOwcJlju57Y4NfPO6JrbuHOCHD2zl9u8sYMfuYX7++G4UIZg7K8AVlzag2KxG647dw0yq9RQWBXm/NaLg2moPpjniX90ulZuvn4NFM/QPpAj4HIVadnbjSA8yj3gyi5E1KfXaCxWIFZ9GzqOqgi07BlFVlXNOr+aFFztzGcA4ETh5YglnLq3gjn/fyqM/Xo7bbePxlS2cuaSay/6mHj1jEqx00dEVw25TrcrElDz8xB68HhtfvnwaN9++gdpqD8uXVvFPd28kkchiAl+4pJ5lC0MYJrzwUhfhqM65Z9Tg89pz3eqxZVkmY0VJp0OlstyJKUf2ga0UB0zTLKgr73asrYaR1CVfzeQ5WvdqD1kDliwI8sJLXVY0N47MYFFpTFdPku27etBspVxx/TqGwjrX/N10VpxXS09vAj1j8OBdS/G4reblHbeehsOucumFk2nvirNy9X5smqA84GBPS4T1G3q56WtNLJ5Xyf0P7wTg5//TzG//sJ+uA0m+d88mOrrjKAq88uYBbr93M48/2UIiZaBpAqdDxTAkiWQ25xJGOjGaJrDb1dzmloJpWruF+WpRiBEfCCMpTE9vknhCLzQRir2foehtTV03qQ45KfO5kMLD7r0DQJZ4PI3LJfj8xQ3MneXHNKyi3DAldRO9uJwqzfvCzJkRIFRplYH3PbSdnt4k0ZjO9CllfO1LM/j+v21Gzxj87UX1/OuPNnHN3zWybFGQi656jmuvmsGed6zu9fdvOpUdzcM8tmofmiJYMK+CC86utdImIdjePERNlZtAmSNH0NjG8ugtAykl2azEblf4p7s2su61fhY0lbHp7YEjbm0e3ca6sPp7/YMpysqcOGwJbGoaU5o01LlZcV4dzS0pHn5iU66JKclkDaoqnZy1NESwwsmO5iGiiSxVFS6+fPlUhsM6hmG5ByHgxutm85//3cwjv9rNeWfWcNaSKjKGVVXEYjpul8ZbW3swTckjT+zBME2+9Plp/ODezVRVulgwp4Lb7txIIpVBCMFnV9SxbFEIIeDlNw4QjWU4a2l1ocGQV6HdbrGraQqxWIqtOwYKRBeD4gjM3VcihMK+dyIFUpGCaCzLn17pRJpQ6VetvqAKl1w4BadD4b9+tYfe/hR2u40Sj5OA382f1w/j86qAQSyexqZa5eC1V01nKKJTVmpDAl6Pxn0/+BhPrm7F5VR54M5lKIrg/OU1/M+qfbz4Wg+xuI4Q0DeYYt1r3fz07mXs3DPMg7/cxbJFIf7j4R28uamPxql+Xnipi+9+fS7lAQcbtvTz0us9NE4p44JzagGR2w8ujrg8ir47q/AHCghp3Yp2JOTb73k/s3xJFY1TynhyzX527QlbSbkQzJgaojzgZdfeQYxsBj2TQdd15swI8MXPTSkkwPlGw8xpZRzoS7J+Yy/zZpfTMNnKE++6fyu9fSkSySyTaj3c/LU5fOf2NzElXH3ldL79gzf5l2/Nx+ux8dXvvMoVn53Cth0DLF0YYt/+GL/5/V5KvU4M4/B54Oi7s46awIMhhNV2krL429DAyi0lEikFyxYFqSx3smZtB7GYAZjMn13OtKk1PLeug9aOCJoqSaUzgMm5y6o5bV4FDptKxjBJpgyWLAgyY5qP7gMJMhmzkHz39qd45Fe7ae+M4/fZue0f5rG/I8bNP3iTr35pBs37wjy/rpNyv5tTm8pYubrtiOI4JIFwfO7Ot24ws3bUBFZr7FBzFEJgGiaTaj1UBT280x5hcFBHIpk4wcOF50xk49YBnl3XiWkKFEXB7rBRV+tlQpUTl1MghCSRzNDY4OPzFzdQ6rXR258gVOkpmOi2nUOsemY/5QEXup7lsVWtfPOaRv7zv5sPu5aDPxb7vhD4lxjbgVYVa5PqcHmXBOya1WWWQEo3yOomgTIHf3txPW2dMVY+00oykQEJpT430xqC6LrB0HAcux2i0TShSgdXXNpA00w/um6wbecwd/14K5MmBhgYiFh3XeQ3+d4FRyQQTozPiBTqVbN416Ao1v3V2axkQrWHT5xVy5tb+nhraz+maRLwOVjysVPY355kR3M/2WyGqpCXxnonb23uIWtibSgXSR68h7v0jzdG9+kOB2uLVYLMbTBZB+nsifPwE5Y5OuwqhqGgaQpZPY4qEnicGVJpA4emE41BVua2ag+xP3Po8x8CJ4IKjwV5fyuwamvT5JBBYXSyXGzifDA+dJ/WzBu8xPo4xhjyhChULDBSleS3OI8Fh9XqyarC4jDSVT8SDvdAiiP+9YebxCPjSE/zOKIJnyjP6fsgUMzaP3Q+8P1GUQR+FFVY7JqLVuBHicSjWetRmfBHgcSjXeNR+8APM4nHsrZjCiIfRhKPdU3vmYiTPU98r2J4z2nMyazG8Zj7uOSBJyOJ4zXncV/4iW7SJ+xDaA/GiUbkSfMY5IPxQRN50j6I+2D89VHw44i//jOC44CT9d9h/B8QoCyMOp6pRwAAAABJRU5ErkJggg==';

/**
 * 「サーボ [ ] を [ ] 度にする」のピンのメニュー。
 *
 * PWM を出せる 8 本を並べる。表記の決め方は variant.js と同じで、
 * 基板のシルクで選ばせ、デバイスへは Arduino 番号を送る (A1 / A2 / A3 = D0 / D6 / D12)。
 *
 * D3 には基板上に 2.2kΩ のプルアップがある。PWM を出している間は効かないが、
 * 止めて入力に戻すと High 側へ引かれ、LED を繋いでいるとうっすら光ることがある。
 * PWMmin のスケッチ例 PWMminRemap3 はこれを理由に D3 を外しているが、ここでは並べる。
 *
 * D15 / D16 は UART の Tx / Rx と同じ足。シリアル通信を始めた後は
 * デバイスが PWM を RSP_ERR で弾く。
 * @type {Array<{text: string, value: string}>}
 */
export const PWM_PIN_ITEMS = [
    {text: '3', value: '3'},
    {text: '5', value: '5'},
    {text: '9', value: '9'},
    {text: '15', value: '15'},
    {text: '16', value: '16'},
    {text: 'A1', value: '0'},
    {text: 'A2', value: '6'},
    {text: 'A3', value: '12'}
];

/**
 * PWM を出すブロック (アナログ出力とサーボ) の既定ピン。
 *
 * HID 版の D2 は使えない (PWM を出せない)。D5 にしてあるのは、
 * どちらの版でも PWM を出せるピンで、プルアップも UART との兼用も無いため。
 * @type {number}
 */
export const PWM_DEFAULT_PIN = 5;
