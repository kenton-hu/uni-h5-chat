import {createSSRApp} from 'vue'
import App from './App'
import {createPinia} from 'pinia'
import store from "./store";
import {createI18n} from 'vue-i18n'
import picker from "./common/picker";
import wfc from "./wfc/client/wfc";
import forward from "./common/forward";
// web端
import avengineKit from './wfc/av/internal/engine.min';
import { getItem, setItem } from './pages/util/storageHelper';
import zhCNLang from './assets/lang/zh-CN.json';
import zhTWLang from './assets/lang/zh-TW.json';
import enLang from './assets/lang/en.json';
import mitt from 'mitt';
import { v4 as uuidv4 } from 'uuid';
import appServerApi from './api/appServerApi';

// import VConsole from 'vconsole';

// const vConsole = new VConsole();

const app = createSSRApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(picker)
app.use(forward)

const i18n = createI18n({
    // 使用localStorage存储语言状态是为了保证页面刷新之后还是保持原来选择的语言状态
    locale: getItem('lang') ? getItem('lang') : 'zh-CN', // 定义默认语言为中文
    allowComposition: true,
    messages: {
        'zh-CN': zhCNLang,
        'zh-TW': zhTWLang,
        'en': enLang
    }
})
app.use(i18n)

/**
 *
 * @param url
 * @param options 普通页面到 nvue 页面 或 nvue 页面到普通页面时，不生效
 */
app.config.globalProperties.$navigateToPage = (url, options) => {
    uni.navigateTo({
        url: url,
        success: (res) => {
            if (options) {
                res.eventChannel.emit('options', options);
            }
        },
        fail: (e) => {
            console.log('navigate to WebViewPage error', e)
        }
    });
}

// 如果不存在会话页面，则入栈，如果已经存在会话页面，则返回到该页面
app.config.globalProperties.$go2ConversationPage = () => {
    let pages = getCurrentPages();
    let cvRoute = 'pages/conversation/ConversationPage'
    let delta = 0;
    let found = false;
    for (let i = pages.length - 1; i >= 0; i--) {
        if (pages[i].route === cvRoute) {
            found = true;
            break;
        } else {
            delta++;
        }
    }
    if (found) {
        uni.navigateBack({
            delta: delta,
            fail: err => {
                console.log('nav back to conversationView err', err);
            }
        });
    } else {
        uni.navigateTo({
            url: '/pages/conversation/ConversationPage',
            success: () => {
                console.log('nav to conversationPage success');

            },
            fail: (err) => {
                console.log('nav to conversationPage err', err);
            }
        })
    }
}
app.config.globalProperties.$scrollToBottom = () => {
    setTimeout(() => {
        uni.pageScrollTo({
            scrollTop: 999999,
            duration: 10
        });
        app.$forceUpdate()
    }, 100);
}

app.config.globalProperties.$notify = (options) => {
    uni.showToast({
        title: options.text,
        icon: 'none',
    });
}

const eventBus = mitt()
eventBus.$on = eventBus.on
eventBus.$off = eventBus.off
eventBus.$emit = eventBus.emit
app.config.globalProperties.$eventBus = eventBus

app.config.globalProperties.$set = (obj, key, value) => obj[key] = value
wfc.init();
// web 端音视频初始化
// 如果不进行初始化，则无法弹出音视频通话界面，不能进行音视频通话。
avengineKit.setup();
// if (pttClient.isPttClientEnable()) {
//     pttClient.init();
// }
store.init();

storeRequest();

export function createApp() {
    return {
        app,
    };
}

/**
 * 存储clientId
 */
function storeRequest() {
	const clientIdS = localStorage.getItem('clientId');
	console.log('storeClientId clientId', clientIdS);
	console.log('main.js', 'init clientId');

	const source = getQueryString('source');
	console.log('getQueryString source', typeof (source));
	const name = getQueryString('name');
	console.log('getQueryString name', typeof (name));
	const displayname = getQueryString('displayname');
	console.log('getQueryString displayname', typeof (displayname));
	const userId = getQueryString('userId');
	console.log('getQueryString userId', typeof (userId));

	if ((source !== undefined && source === '1') &&
		(name !== undefined && name !== '') &&
		(userId !== undefined && userId !== '')) {
		console.log('storeClientId', 'work');

		localStorage.setItem('source', source);
		localStorage.setItem('name', name);
		if (displayname === undefined || displayname === '') {
			localStorage.setItem('displayname', name);
		} else {
			localStorage.setItem('displayname', displayname);
		}
		localStorage.setItem('userId', userId);


		const clientId = uuidv4();
		console.log('main.js', clientId);
		localStorage.setItem('clientId', clientId);

		// getToken(name, userId);
	}
}

/**
 * 获取url中的参数
 * @param {Object} name 参数名
 */
function getQueryString(name) {
	const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, 'i');
	const search = window.location.search.split('?')[1] || '';
	const r = search.match(reg) || [];
	return r[2];
}
