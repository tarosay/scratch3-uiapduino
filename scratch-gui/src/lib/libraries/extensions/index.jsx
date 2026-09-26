import React from 'react';
import {FormattedMessage} from 'react-intl';

import musicIconURL from './music/music.png';
import musicInsetIconURL from './music/music-small.svg';

import penIconURL from './pen/pen.png';
import penInsetIconURL from './pen/pen-small.svg';

import videoSensingIconURL from './videoSensing/video-sensing.png';
import videoSensingInsetIconURL from './videoSensing/video-sensing-small.svg';

import text2speechIconURL from './text2speech/text2speech.png';
import text2speechInsetIconURL from './text2speech/text2speech-small.svg';

import translateIconURL from './translate/translate.png';
import translateInsetIconURL from './translate/translate-small.png';

import makeymakeyIconURL from './makeymakey/makeymakey.png';
import makeymakeyInsetIconURL from './makeymakey/makeymakey-small.svg';

import microbitIconURL from './microbit/microbit.png';
import microbitInsetIconURL from './microbit/microbit-small.svg';
import microbitConnectionIconURL from './microbit/microbit-illustration.svg';
import microbitConnectionSmallIconURL from './microbit/microbit-small.svg';

import ev3IconURL from './ev3/ev3.png';
import ev3InsetIconURL from './ev3/ev3-small.svg';
import ev3ConnectionIconURL from './ev3/ev3-hub-illustration.svg';
import ev3ConnectionSmallIconURL from './ev3/ev3-small.svg';

import wedo2IconURL from './wedo2/wedo.png'; // TODO: Rename file names to match variable/prop names?
import wedo2InsetIconURL from './wedo2/wedo-small.svg';
import wedo2ConnectionIconURL from './wedo2/wedo-illustration.svg';
import wedo2ConnectionSmallIconURL from './wedo2/wedo-small.svg';
import wedo2ConnectionTipIconURL from './wedo2/wedo-button-illustration.svg';

import boostIconURL from './boost/boost.png';
import boostInsetIconURL from './boost/boost-small.svg';
import boostConnectionIconURL from './boost/boost-illustration.svg';
import boostConnectionSmallIconURL from './boost/boost-small.svg';
import boostConnectionTipIconURL from './boost/boost-button-illustration.svg';

import gdxforIconURL from './gdxfor/gdxfor.png';
import gdxforInsetIconURL from './gdxfor/gdxfor-small.svg';
import gdxforConnectionIconURL from './gdxfor/gdxfor-illustration.svg';
import gdxforConnectionSmallIconURL from './gdxfor/gdxfor-small.svg';

import uiapduinoIconURL from './uiapduino/uiapduino.png';
import uiapduinoInsetIconURL from './uiapduino/uiapduino-small.png';
import uiapduinoConnectionIconURL from './uiapduino/uiapduino-illustration.png';
import uiapduinoConnectionBadgeIconURL from './uiapduino/usb-hid-white.svg';
// Remap3 版のカード。大きな絵は uiapduino.png の緑を #3F51B5 (Remap3 版のブロックの色) に
// 置き換えたもの、小さな絵は uiapduino-small.png の線を同じ青にしたもの (背景は透明)。
import uiapduinoRemap3IconURL from './uiapduino/uiapduino-remap3.png';
import uiapduinoRemap3InsetIconURL from './uiapduino/uiapduino-remap3-small.png';

export default [
    {
        name: (
            <FormattedMessage
                defaultMessage="UIAPduino"
                description="Name for the 'UIAPduino' extension"
                id="gui.extension.uiapduino.name"
            />
        ),
        extensionId: 'uiapduino',
        iconURL: uiapduinoIconURL,
        insetIconURL: uiapduinoInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Create your own controller!"
                description="Description for the 'UIAPduino' extension"
                id="gui.extension.uiapduino.description"
            />
        ),
        featured: true,
        // 拡張を追加した直後に接続モーダルを開く。
        // キャンセルされても拡張は追加済みのままで、後からステータスボタンで接続できる。
        launchPeripheralConnectionFlow: true,
        // Bluetooth 機器向けの「本体のボタンを押してください」画面を使わず、
        // 通常の検索ステップを使う。検索自体はマウント時に自動で始まる。
        useAutoScan: false,
        // 接続モーダルの絵は専用のものを使う。高さ 165px ちょうどで作ること。
        //
        // 上流の connection-modal.css は .peripheral-activity-icon のサイズ指定を
        // コメントアウトしており、画像は原寸で表示される。置き場所の .activityArea は
        // 高さ 165px しかないので、一覧用の 600x372 を渡すと枠からはみ出して
        // 「接続しました」やボタンの上に乗る。
        //
        // 165px は padding .5rem を含んだ値なので、149px で作ると上下に 8px ずつ
        // 背景色の帯が出る。165px で作ると padding の分を覆って帯が消える
        // (.activityArea は overflow を指定しておらず、flex 中央寄せで上下へ均等にはみ出す)。
        connectionIconURL: uiapduinoConnectionIconURL,
        connectionSmallIconURL: uiapduinoInsetIconURL,
        // 接続中と接続済みの画面に出る小さなバッジ。
        // 上流は Bluetooth マーク固定だが、UIAPduino は WebHID なので嘘になる。
        // このプロパティを持たない拡張機能は従来どおり Bluetooth マークのままなので、
        // Scratch Link を使う micro:bit などの表示は変わらない。
        connectionBadgeIconURL: uiapduinoConnectionBadgeIconURL,
        // ここは英語のままにしておくこと。defaultMessage は未翻訳ロケール全部に出る。
        // 日本語は uiapduino/messages.js にあり、src/reducers/locales.js が重ねている。
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting to UIAPduino"
                description="Message shown while connecting to UIAPduino."
                id="gui.extension.uiapduino.connectingMessage"
            />
        ),
        helpLink: 'https://github.com/tarosay/scratch3-uiapduino#readme'
    },
    {
        // Remap3 版 (PWM 8 本)。ブロックは HID 版と同じで、PWM を出せるピンが違うだけ。
        // extensionId は scratch-vm の extension-manager.js と
        // scratch3_uiapduino/variantRemap3.js の EXTENSION_ID と同じにすること。
        //
        // 接続モーダルの絵とバッジは HID 版と同じものを使う。繋ぐ基板が同じだから。
        // 説明は上の HID 版の項を読むこと。
        name: (
            <FormattedMessage
                defaultMessage="UIAPduino Remap3"
                description="Name for the 'UIAPduino Remap3' extension"
                id="gui.extension.uiapduinoRemap3.name"
            />
        ),
        extensionId: 'uiapduinoRemap3',
        iconURL: uiapduinoRemap3IconURL,
        insetIconURL: uiapduinoRemap3InsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="UIAPduino with 8 PWM pins."
                description="Description for the 'UIAPduino Remap3' extension"
                id="gui.extension.uiapduinoRemap3.description"
            />
        ),
        featured: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: uiapduinoConnectionIconURL,
        connectionSmallIconURL: uiapduinoInsetIconURL,
        connectionBadgeIconURL: uiapduinoConnectionBadgeIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting to UIAPduino"
                description="Message shown while connecting to UIAPduino Remap3."
                id="gui.extension.uiapduinoRemap3.connectingMessage"
            />
        ),
        helpLink: 'https://github.com/tarosay/scratch3-uiapduino#readme'
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Music"
                description="Name for the 'Music' extension"
                id="gui.extension.music.name"
            />
        ),
        extensionId: 'music',
        iconURL: musicIconURL,
        insetIconURL: musicInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Play instruments and drums."
                description="Description for the 'Music' extension"
                id="gui.extension.music.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Pen"
                description="Name for the 'Pen' extension"
                id="gui.extension.pen.name"
            />
        ),
        extensionId: 'pen',
        iconURL: penIconURL,
        insetIconURL: penInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Draw with your sprites."
                description="Description for the 'Pen' extension"
                id="gui.extension.pen.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Video Sensing"
                description="Name for the 'Video Sensing' extension"
                id="gui.extension.videosensing.name"
            />
        ),
        extensionId: 'videoSensing',
        iconURL: videoSensingIconURL,
        insetIconURL: videoSensingInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense motion with the camera."
                description="Description for the 'Video Sensing' extension"
                id="gui.extension.videosensing.description"
            />
        ),
        featured: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Text to Speech"
                description="Name for the Text to Speech extension"
                id="gui.extension.text2speech.name"
            />
        ),
        extensionId: 'text2speech',
        collaborator: 'Amazon Web Services',
        iconURL: text2speechIconURL,
        insetIconURL: text2speechInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Make your projects talk."
                description="Description for the Text to speech extension"
                id="gui.extension.text2speech.description"
            />
        ),
        featured: true,
        internetConnectionRequired: true
    },
    {
        name: (
            <FormattedMessage
                defaultMessage="Translate"
                description="Name for the Translate extension"
                id="gui.extension.translate.name"
            />
        ),
        extensionId: 'translate',
        collaborator: 'Google',
        iconURL: translateIconURL,
        insetIconURL: translateInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Translate text into many languages."
                description="Description for the Translate extension"
                id="gui.extension.translate.description"
            />
        ),
        featured: true,
        internetConnectionRequired: true
    },
    {
        name: 'Makey Makey',
        extensionId: 'makeymakey',
        collaborator: 'JoyLabz',
        iconURL: makeymakeyIconURL,
        insetIconURL: makeymakeyInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Make anything into a key."
                description="Description for the 'Makey Makey' extension"
                id="gui.extension.makeymakey.description"
            />
        ),
        featured: true
    },
    {
        name: 'micro:bit',
        extensionId: 'microbit',
        collaborator: 'micro:bit',
        iconURL: microbitIconURL,
        insetIconURL: microbitInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Connect your projects with the world."
                description="Description for the 'micro:bit' extension"
                id="gui.extension.microbit.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: microbitConnectionIconURL,
        connectionSmallIconURL: microbitConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their micro:bit."
                id="gui.extension.microbit.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/microbit'
    },
    {
        name: 'LEGO MINDSTORMS EV3',
        extensionId: 'ev3',
        collaborator: 'LEGO',
        iconURL: ev3IconURL,
        insetIconURL: ev3InsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Build interactive robots and more."
                description="Description for the 'LEGO MINDSTORMS EV3' extension"
                id="gui.extension.ev3.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: ev3ConnectionIconURL,
        connectionSmallIconURL: ev3ConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting. Make sure the pin on your EV3 is set to 1234."
                description="Message to help people connect to their EV3. Must note the PIN should be 1234."
                id="gui.extension.ev3.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/ev3'
    },
    {
        name: 'LEGO BOOST',
        extensionId: 'boost',
        collaborator: 'LEGO',
        iconURL: boostIconURL,
        insetIconURL: boostInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Bring robotic creations to life."
                description="Description for the 'LEGO BOOST' extension"
                id="gui.extension.boost.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: true,
        connectionIconURL: boostConnectionIconURL,
        connectionSmallIconURL: boostConnectionSmallIconURL,
        connectionTipIconURL: boostConnectionTipIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their BOOST."
                id="gui.extension.boost.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/boost'
    },
    {
        name: 'LEGO Education WeDo 2.0',
        extensionId: 'wedo2',
        collaborator: 'LEGO',
        iconURL: wedo2IconURL,
        insetIconURL: wedo2InsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Build with motors and sensors."
                description="Description for the 'LEGO WeDo 2.0' extension"
                id="gui.extension.wedo2.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: true,
        connectionIconURL: wedo2ConnectionIconURL,
        connectionSmallIconURL: wedo2ConnectionSmallIconURL,
        connectionTipIconURL: wedo2ConnectionTipIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their WeDo."
                id="gui.extension.wedo2.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/wedo'
    },
    {
        name: 'Go Direct Force & Acceleration',
        extensionId: 'gdxfor',
        collaborator: 'Vernier',
        iconURL: gdxforIconURL,
        insetIconURL: gdxforInsetIconURL,
        description: (
            <FormattedMessage
                defaultMessage="Sense push, pull, motion, and spin."
                description="Description for the Vernier Go Direct Force and Acceleration sensor extension"
                id="gui.extension.gdxfor.description"
            />
        ),
        featured: true,
        disabled: false,
        bluetoothRequired: true,
        internetConnectionRequired: true,
        launchPeripheralConnectionFlow: true,
        useAutoScan: false,
        connectionIconURL: gdxforConnectionIconURL,
        connectionSmallIconURL: gdxforConnectionSmallIconURL,
        connectingMessage: (
            <FormattedMessage
                defaultMessage="Connecting"
                description="Message to help people connect to their force and acceleration sensor."
                id="gui.extension.gdxfor.connectingMessage"
            />
        ),
        helpLink: 'https://scratch.mit.edu/vernier'
    }
];
