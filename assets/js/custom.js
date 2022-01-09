
window.TOPIC_TRIBE_CHANGED = '0x888c9a10b7ca50a5d2d41efe579065f68476eb3cf3054a42d4c0a37bfb430111';
window.TOPIC_AIRDROP_CREATED = '0xc6acfc374e72a8333c4e6ddad4579a1ad86b14d752b06808c9cba338f3e61691';

function isValidAddress(s) {
    return ethers.utils.isAddress(s);
}

function formatAddress(s) {
    if (s.indexOf('0x') === 0 && s.length === 42) {
        return ethers.utils.getAddress(s.substring(0));
    }
    return s;
}

// display as abbrive address: 0xA1b2C3...9E8D7f
function abbrAddress(s) {
    if (s.indexOf('0x') === 0 && s.length === 42) {
        let addr = ethers.utils.getAddress(s.substring(0));
        return addr.substring(0, 6) + '...' + addr.substring(38);
    }
    return s;
};

String.prototype.abbrAddress = function () {
    let s = this;
    if (s.indexOf('0x') === 0 && s.length === 42) {
        let addr = ethers.utils.getAddress(s.substring(0));
        return addr.substring(0, 6) + '...' + addr.substring(38);
    }
    return s;
};

Number.prototype.dateTime = function () {
    let ts = this;
    if (!isNaN(ts) && ts !== 0) {
        return new Date(ts * 1000).toLocaleString();
    }
    return 'N/A';
};

Number.prototype.smartDate = function () {
    let ts = this;
    if (!isNaN(ts) && ts !== 0) {
        let abs = Math.abs(window.__time__ - ts);
        if (ts <= window.__time__) {
            // past:
            if (abs <= 60) {
                return '1 minute ago';
            }
            if (abs <= 3540) {
                return parseInt(abs / 60) + ' minutes ago';
            }
            if (abs <= 3600) {
                return '1 hour ago';
            }
            if (abs <= 82800) {
                return parseInt(abs / 3600) + ' hours ago';
            }
            if (abs <= 86400) {
                return '1 day ago';
            }
            return new Date(ts * 1000).toLocaleDateString();
        }
        // future:
        if (abs <= 60) {
            return '1 minute';
        }
        if (abs <= 3540) {
            return parseInt(abs / 60) + ' minutes';
        }
        if (abs <= 3600) {
            return '1 hour';
        }
        if (abs <= 82800) {
            return parseInt(abs / 3600) + ' hours';
        }
        if (abs <= 86400) {
            return '1 day';
        }
        return new Date(ts * 1000).toLocaleDateString();
    }
    return 'N/A';
};

$(function () {
    console.log('init...');
    initVueFilters();
    initWallet();
});

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

function getChainName(chainId) {
    let chain = window.chains[chainId];
    return chain && chain.chainName || 'Unsupported Chain (0x' + chainId.toString(16) + ')';
}

async function postJSON(url, data) {
    if (!data) {
        data = {};
    }
    return await $.ajax({
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        url: url,
        data: JSON.stringify(data)
    });
}

async function getJSON(url, data) {
    if (!data) {
        data = {};
    }
    return await $.ajax({
        type: 'GET',
        dataType: 'json',
        url: url,
        data: data
    });
}

function getParam(parameterName, defaultValue) {
    let
        result = defaultValue,
        tmp = [],
        items = location.search.substring(1).split('&');
    for (let index = 0; index < items.length; index++) {
        tmp = items[index].split('=');
        if (tmp[0] === parameterName) {
            return decodeURIComponent(tmp[1]);
        }
    }
    return result;
}

function showAlert(title, message) {
    let m = $('#alertModal');
    m.find('.x-title').text(title);
    m.find('.x-message').text(message);
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    myModal.show();
}

function showInfo(title, message) {
    let m = $('#infoModal');
    m.find('.x-title').text(title);
    m.find('.x-message').text(message);
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    myModal.show();
}

function showLoading(title, message) {
    let m = $('#loadingModal');
    let myModal = new bootstrap.Modal(m.get(0), { backdrop: 'static', keyboard: false });
    let obj = {
        setTitle: (t) => {
            m.find('.x-title').text(t);
        },
        setMessage: (t) => {
            m.find('.x-message').text(t);
        },
        close: () => {
            setTimeout(function () {
                myModal.hide();
            }, 500);
        }
    }
    obj.setTitle(title);
    obj.setMessage(message);
    myModal.show();
    return obj;
}

function translateError(err) {
    if (typeof (err) === 'string') {
        return err;
    }
    if (err.code && err.message && err.data) {
        return `Error (${err.code}): ${err.message} Data: ${err.data}`;
    }
    if (err.code && err.message) {
        return `Error (${err.code}): ${err.message}`;
    }
    return err.message || err.toString();
}

function initVueFilters() {
    Vue.filter('abbrAddr', function (addr) {
        if (addr) {
            return addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
        }
        return '';
    });

    Vue.filter('formatDate', function (ts) {
        let d = new Date(ts * 1000);
        return d.toLocaleDateString();
    });

    Vue.filter('formatDateTime', function (value) {
        if (!value) {
            return '-';
        }
        let s = new Date(value * 1000).toLocaleString();
        return s.replace(':00:00', ':00');
    });
}

function getWeb3Provider() {
    if (!window.web3Provider) {
        if (!window.ethereum) {
            console.error("there is no web3 provider.");
            return null;
        }
        window.web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    return window.web3Provider;
}

function initWallet() {
    console.log('init vm_wallet...');
    window.vm_wallet = new Vue({
        el: '#vm-wallet',
        data: {
            account: null,
            chainId: 0,
            chainName: getChainName(0)
        },
        computed: {
            ready: function () {
                return this.account && this.chainId > 0;
            },
            imageUrl: function () {
                let h = 0;
                if (this.account !== null) {
                    let i, l = this.account.length;
                    for (i = 0; i < l; i++) {
                        h = (h << 5) - h + this.account.charCodeAt(i);
                    }
                }
                let index = (h & 0xffffff) % 10;
                return '/assets/images/users/' + index + '.svg';
            }
        },
        methods: {
            abbrAddress: function (s) {
                return window.abbrAddress(s);
            },
            gotoScanUrl: function () {
                let chain = window.chains[this.chainId];
                let url = chain && this.account && (chain.explorerUrl + '/address/' + this.account);
                window.open(url);
            },
            getBlockNumber: async function () {
                return await window.getWeb3Provider().getBlockNumber();
            },
            getTransactionReceipt: async function (hash) {
                return await window.getWeb3Provider().getTransactionReceipt(hash);
            },
            getBalance: async function (addr) {
                let account = addr || this.account;
                let balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [account, 'latest']
                });
                return ethers.BigNumber.from(balance);
            },
            loadContract: function (name, addr /* optional */) {
                if (!this.ready) {
                    console.error('wallet not ready.');
                    return null;
                }
                let
                    abi = window.abis[name],
                    chain = window.chains[this.chainId],
                    address = addr || (chain && chain.contracts[name]);
                if (!abi) {
                    console.error('cannot find abi by name: ' + name);
                    return null;
                }
                if (!address) {
                    console.error('cannot find address by name: ' + name);
                    return null;
                }
                return new ethers.Contract(address, abi, window.getWeb3Provider().getSigner());
            },
            signMessage: async function (msg) {
                console.log('request sign message: ' + msg);
                return await window.getWeb3Provider().getSigner().signMessage(msg);
            },
            accountChanged: function (accounts) {
                console.log('wallet account changed:', accounts.length === 0 ? null : accounts[0]);
                if (accounts.length === 0) {
                    this.disconnected();
                    ocument.cookie = '__account__=0x;path=/';
                } else {
                    this.account = accounts[0];
                    document.cookie = '__account__=' + this.account + ';path=/;max-age=1296000';
                    $('[show-address^=0x]').hide();
                    $('[hide-address^=0x]').show();
                    $('[show-address=' + this.account + ']').show();
                    $('[hide-address=' + this.account + ']').hide();
                    $('.x-current-address').text(abbrAddress(this.account));
                    window.vm && window.vm.setCurrentAccount && window.vm.setCurrentAccount(this.account).then(r => console.log('done')).catch(err => console.error(err));
                }
            },
            disconnected: async function () {
                console.warn('wallet disconnected.');
                this.account = null;
                this.chainId = 0;
                this.chainName = 'Unsupported Chain';
                $('[show-address*=0x]').hide();
                $('[hide-address*=0x]').show();
                $('.x-current-address').text('N/A');
                try {
                    await window.vm.setCurrentAccount(null);
                } catch (e) { }
            },
            chainChanged: function (chainId) {
                console.log('wallet chainId changed: ' + chainId + ' = ' + parseInt(chainId, 16));
                this.chainId = parseInt(chainId, 16);
                this.chainName = getChainName(this.chainId);
            },
            connectWallet: async function () {
                console.log('try connect wallet...');
                if (window.getWeb3Provider() === null) {
                    console.error('there is no web3 provider.');
                    return false;
                }
                try {
                    this.accountChanged(await window.ethereum.request({
                        method: 'eth_requestAccounts',
                    }));
                    this.chainChanged(await window.ethereum.request({
                        method: 'eth_chainId'
                    }));
                    window.ethereum.on('disconnect', this.disconnected);
                    window.ethereum.on('accountsChanged', this.accountChanged);
                    window.ethereum.on('chainChanged', this.chainChanged);
                } catch (e) {
                    console.error('could not get a wallet connection.', e);
                    return false;
                }
                console.log('wallet connected.');
                return true;
            },
            verifyAddress: async function () {
                let loading = null;
                let account = this.account;
                try {
                    let signMessage = new Date().toISOString();
                    loading = showLoading('Verify Address', 'Please sign the message "' + signMessage + '" to verify your address: ' + account);
                    let signature = await window.vm_wallet.signMessage(signMessage);
                    loading.setMessage('Waiting for server response...');
                    let resp = await postJSON('/api/verify', {
                        signMessage: signMessage,
                        signature: signature
                    });
                    if (!resp.success) {
                        throw resp.errorMessage;
                    }
                    loading.close();
                    let verified = resp.result === account;
                    console.log('get verify result: ' + verified + ", json = " + JSON.stringify(resp));
                    return verified;
                }
                catch (err) {
                    console.error(err);
                    loading.close();
                    showAlert('Error', translateError(err));
                }
            }
        },
        mounted: function () {
            $('#vm-wallet').show();
            console.log('wallet mounted.');
            // get cached account by cookie:
            var acc = document.cookie.replace(/(?:(?:^|.*;\s*)__account__\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            if (acc) {
                console.log('auto connect wallet...');
                // auto connect:
                this.connectWallet();
            }
        }
    });
}
