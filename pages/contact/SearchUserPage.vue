<template>
    <view class="search-user-container">
        <input class="input" type="text" v-model="keyword" :placeholder="$t('common.search')" @input="searchUser">
        <view v-if="users && users.length">
            <text class="category">搜索结果</text>
            <UserListView
                class="result"
                :enable-pick="false"
                :users="users"
                :show-category-label="false"
                :padding-left="'10px'"/>
        </view>
        <text v-if="keyword && !users.length" class="tip">没有搜索到用户</text>
    </view>
</template>

<script>
import UserListView from "../user/UserListView.vue";
import wfc from "../../wfc/client/wfc";
import SearchType from "../../wfc/model/searchType";
import appServerApi from "../../api/appServerApi";

export default {
    name: "SearchUserPage",
    components: {UserListView},
    data() {
        return {
            keyword: '',
            users: [],
        }
    },
    methods: {
        searchUser() {
            if (!this.keyword.trim()) {
                this.users = [];
                return;
            }
            console.log('search user', this.keyword);
            wfc.searchUser(this.keyword, SearchType.General, 0, (keyword, users) => {
                console.log('searchUser success', keyword, users)
                this.users = users;
            }, err => {
                console.log(' searchUser err', err)
            });
			// app-server搜索扩展
			appServerApi.searchAbcUserList(this.keyword)
				.then(response => {
					console.log(response)
					if (response !== '') {
						// 转换成json
						let result = response
						console.log("result", result)
						if (result.code === 0 && '' !== result.result) {
							result.result.filter(u => {
								let userInfo = JSON.parse(u);
								console.log("userInfo", userInfo)
								let flag = !wfc.isMyFriend(userInfo.uid)
								if (flag) {
									this.users.push(userInfo)
								}
								return !flag
							})
							// searchState.userSearchResult = resultArray
			
							// console.log("searchState.userSearchResult", searchState.userSearchResult)
						}
					}
				})
				.catch(err => {
					console.log('search abc user error', this.keyword, err)
					// searchState.userSearchResult = resultArray
				})
        }
    }
}
</script>

<style lang="css" scoped>
.search-user-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.input {
    height: 40px;
    padding: 0 10px;
    width: 100%;
    border-bottom: 1px solid lightgrey;
}

.category{
    padding: 5px 10px;
}

.result {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
}

.tip {
    padding-top: 40px;
    text-align: center;
}

</style>