<script>
import store from "./store";
import {getItem, setItem} from "./pages/util/storageHelper";
import wfc from "./wfc/client/wfc";
import conferenceManager from "./pages/voip/conference/conferenceManager";
import ConferenceInviteMessageContent from "./wfc/av/messages/conferenceInviteMessageContent";
import Message from "./wfc/messages/message";
import ForwardType from "./pages/conversation/message/forward/ForwardType";
import ConnectionStatus from "./wfc/client/connectionStatus";
import { v4 as uuidv4 } from 'uuid';
import appServerApi from './api/appServerApi';

export default {
    data() {
        return {
            wfc: null,
            store: null,
            conferenceManager: null,
        }
    },
    onLaunch: function () {
        console.log("App Launch");
        this.wfc = wfc;
        this.store = store;
        this.conferenceManager = conferenceManager;
        // #ifdef APP-PLUS
        plus.push.getClientInfoAsync((info) => {
            let cid = info["clientid"];
            if (cid) {
                console.log('push clientId', cid);
                wfc.setDeviceToken(7, cid);
            }
        });
        // #endif
    },
    onShow: function () {
        console.log("App Show");
        store.state.misc.isAppHidden = false;
		
		let source = localStorage.getItem("source")
		console.log("source", source)
		if (source == 1) {
			let displayname = localStorage.getItem("displayname")
			let name1 = localStorage.getItem("name")
			let userId1 = localStorage.getItem("userId")
			
			getToken(name1, userId1,displayname)
		} 
		
		
        // #ifdef H5
        let userId = getItem('userId');
        let token = getItem('token')
        if (token) {
            if(wfc.getConnectionStatus() === ConnectionStatus.ConnectionStatusConnected){
                console.log('app Show and connected')
                return;
            }
            wfc.connect(userId, token);
            this.go2ConversationList();
        } else {
            uni.redirectTo({
                url: '/pages/login/LoginPage',
            })
        }
        // #endif
    },

    mounted() {
        //屏蔽默认的contextmenu事件
        document.oncontextmenu = (e) => e.preventDefault();
    },

    onHide: function () {
        console.log("App Hide");
        store.state.misc.isAppHidden = true;
    },
    methods: {
        go2ConversationList() {
            uni.switchTab({
                url: '/pages/conversationList/ConversationListPage',
                success: () => {
                    console.log('to conversation list success');
                },
                fail: e => {
                    console.log('to conversation list error', e);
                },
                complete: () => {
                    console.log('switch tab complete')
                }
            });
        },

        forwardConferenceInviteMessage(callId, host, title, desc, startTime, audioOnly, defaultAudience, advance, pin) {
            let inviteMessageContent = new ConferenceInviteMessageContent(callId, host, title, desc, startTime, audioOnly, defaultAudience, advance, pin);
            console.log('invite', inviteMessageContent);
            let message = new Message(null, inviteMessageContent);
            this.$forward({
                forwardType: ForwardType.NORMAL,
                messages: [message]
            });
        },
    }
}

async function getToken(name, userId, displayname) {
	const result = await appServerApi.getToken(name, userId, displayname);
	console.log('login result', result);
	const resultUserId = result.userId;
	const token = result.token;
	wfc.connect(resultUserId, token);
	setItem('userId', resultUserId);
	setItem('token', token);
	go2ConversationList();
}

function go2ConversationList() {
	uni.switchTab({
		url: '/pages/conversationList/ConversationListPage',
		success: () => {
			console.log('to conversation list success');
		},
		fail: (e) => {
			console.log('to conversation list error', e);
		},
		complete: () => {
			console.log('switch tab complete');
		},
	});
}

</script>

<style lang="css">
/*每个页面公共css */
@import './global.css';
@import './wfc.css';
/* #ifndef APP-NVUE */
@import './static/iconfonts/customicons.css';
@import './static/iconfonts/icomoon/style.css';
/* #endif */


:root {
    --uni-tabbar-height: 50px;

    /*app-plus header 和 tabbar 是原生的*/

    /* #ifdef APP-PLUS */
    --uni-page-header-height: 0;
    --page-full-height-without-header-and-tabbar: 100vh;
    --page-full-height-without-header: 100vh;
    /* #endif */
    /* #ifdef H5 */
    --uni-page-header-height: 44px;
    --page-full-height-without-header-and-tabbar: calc(100vh - 44px - 50px);
    --page-full-height-without-header: calc(100vh - 44px);
    /* #endif */
}

</style>
