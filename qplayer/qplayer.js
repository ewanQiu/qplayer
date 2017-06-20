var qPlayer = {
	container:null,
	audio: '',//当前Audio对象
	audios:new Array(),//audio容器

	view:'',//界面
	viewProgress:'',//进度DIV对象
	viewProgressBtn:'',//进度按钮
	viewProgressBg:'',//进度背景
	viewProgressPerWidth:'',//进度每一帧长度
	viewProgressWidth:'',//可走的进度条长度
	viewPlayShow:'',//html播放暂停状态

	host: document.domain,
	cookiename: "",
	currentTime:'',
	isEnd:0,//是否结束
	initParatemer:'',
	isLoad:0,//控制再次init时某些东西只加载一次
	isEventAudio:0,//控制IOSaudio事件只加载一次
	isLoadAudio:0,//音频是否加载过了
	device:'',//设备
	duration:null,//总时长
	ware:null,//课件
	currentWare:null,//当前课件
	timeSort:'desc',//播放时间顺序
	isEnd:0,

	
	init: function(container,audio){
		var _this = this;
		this.container = container;
		this.changeParatemer(audio);
		this.isIOS();
		this.__loadHtml();
		this.__loadAudio();
		this.__loadView();
		this.isLoad = 1;
		//this.isEnd = 0;
		this.currentTime = 0;


		var st = '';
		function orientationChange()//手机横屏竖屏切换改变进度
		{
			if(st != '') clearTimeout(st);
			st = setTimeout(function(){
				var radio = _this.currentTime/_this.duration;
				_this.viewProgressWidth = _this.viewProgress.width() - $(".on-off-btn").width()/2;
				_this.viewProgressPerWidth = Math.floor((_this.viewProgressWidth / _this.duration)*100)/100;
				_this.viewProgressBtn.css("left",_this.viewProgressWidth * radio);
			},200);
		}
		window.addEventListener('orientationchange', orientationChange);
	},

	changeParatemer:function(audio){
		this.initParatemer = audio;
		if(!this.initParatemer.pic) this.initParatemer.pic = "./images/play_start.png";
		this.duration = this.initParatemer.time;
		this.cookiename =   "audio_ctime-" + this.initParatemer.cid;
		this.setWare(this.initParatemer.ware);
		if(this.initParatemer.timeSort)
			this.timeSort = this.initParatemer.timeSort;

	},

	__loadHtml:function(){
		if(this.isLoad == 1)
		{
			//$("#qplayer-ware").attr("src",this.initParatemer.pic);//图片换成默认图片
		       	return;
		}
		var _this = this;

		var viewHtml = '<div class="qplayer-play-head">'+
            '<span class="qplayer-less-banner"><img id="qplayer-ware" src="'+this.initParatemer.pic+'" onerror="javascript:this.src=\'./images/play_start.png\'"></span>'+
            '<!--less-play-->'+
            '<div class="qplayer-less-play">'+
               '<!--less-play-head -->'+
               '<div class="qplayer-less-play-head" style="display:none;">'+
                  '<i class="qplayer-play-ico"></i>'+
                  '<span class="qplayer-play-time">'+
                    '<p class="qplayer-time" id="qplay_time"></p>'+
                    '<p>点击播放</p>'+
                  '</span>'+
                '</div>'+
                '<!--less-play-head end! -->'+
                '<!--less-pause-head -->'+
               '<div class="qplayer-less-pause-head">'+
                    '<div class="qplayer-btn">'+
                         '<a href="javascript:void(0)" class="qplayer-play-ico" id="play-ico"></a>'+
                         '<span class="qplayer-play-text fl">播放</span>'+
                    '</div>'+
                    '<span class="qplayer-time" id="current_time">00:00</span>'+
                    '<!--progress-bar-->'+
                    '<div class="qplayer-progress-bar">'+
                        '<div class="qplayer-progress" id="progress">'+
                           '<span class="qplayer-bg"></span>'+
                           '<span class="qplayer-bg qplayer-bg-blue" id="qplayer-bg-blue"></span>'+
                           '<span class="on-off-btn" id="qplayer-progress-btn"></span>'+
                        '</div>'+ 
                    '</div>'+
                    '<!--progress-bar end -->'+
               '</div>'+ 
               '<!--less-pause-head end-->'+
            '</div>'+
            '<!--less-play end!-->'+
		'<div class="qplayer-play-position qplayer-play-load qplayer-hid" id="play_loading"><span class="qplayer-play-load-pic"></span></div>'+
		'<a href="javascript:void(0)" class="qplayer-play-position qplayer-hid" id="play_pause"><span class="qpause-ico"></span></a>'+
       '</div>';
		this.container.prepend(viewHtml);

		var height = this.container.width()/2;

		$(".qplayer-less-banner").css("height",height);

		//播放暂停
		$("#play-ico,#play_pause").click(function(){
			if($(this).hasClass("qplayer-pause-ico"))
			{
				_this.viewPlay();
			}else
			{
				_this.audio.currentTime = _this.currentTime;//ios中第一次拉动进度条不能成功所以这里做个兼容处理到播放的时候设置进度条
				_this.viewPause();
			}
		});


	},

	__loadAudioObj:function(url){
		if(this.audio) this.audio.pause();//前一个音频暂停播放
		this.isLoadAudio = 0;
		if(this.audios[url])
		{
			//重置时间
			this.audios[url].currentTime = 0;
			this.duration = this.audios[url].duration;	
			this.isLoadAudio = 1;
			return this.audios[url];
		}

		return this.__addAudioObj(url);
	},

	__eventAudio:function(loadedAudio){
		var _this = this;
		//监听结束
		loadedAudio.addEventListener("ended", function() {
			_this.viewPlay();
			if(typeof _this.initParatemer.playend === 'function' )
			{
				_this.initParatemer.playend();
			}
			_this.isEnd = 1;
		}, false);

		//播放时间改变
		function timeupdate()
		{
			loadedAudio.addEventListener("timeupdate", function() {
				_this.viewLoadHide();
				_this.viewTimeUpdate(loadedAudio.currentTime);
				_this.recordCurrentTime();
				_this.currentTime = loadedAudio.currentTime;
			}, false);
		}

		loadedAudio.addEventListener("seeked",function() {
			_this.viewPause();
		},false);

		loadedAudio.addEventListener("waiting",function() {
		},false);

		loadedAudio.addEventListener("canplay",function() {
			//console.log("canplay");
		},false);

		loadedAudio.addEventListener("loadeddata",function() {
			//console.log("loadeddata");
		},false);

		//初始化时间和宽度
		loadedAudio.addEventListener("loadedmetadata",function(){
			loadedmetadata();	
		},false);

		function loadedmetadata()
		{
			_this.isEnd = 1;
			if(!_this.duration)//APP传过来的音频时间不准所以这里如果有传入时间就不直接获取音频时间了
				_this.duration = loadedAudio.duration;
			_this.duration = parseInt(_this.duration,10);
			timeupdate();
			$("#qplay_time").html(_this.duration);
			//_this.initParatemer.time = _this.duration;
			_this.viewCurrentTime.html(_this.formatViewTime(_this.duration));
			_this.viewProgressWidth = _this.viewProgress.width() - $(".on-off-btn").width()/2;
			_this.viewProgressPerWidth = Math.floor((_this.viewProgressWidth / _this.duration)*100)/100;
			//console.log('duration-'+_this.formatViewTime(_this.duration));
		}

		loadedAudio.addEventListener("canplaythrough",function() {
			if(_this.device == 'ios')//可播放状态 安卓这里没有正确判断
			{
				_this.viewLoadHide();
			}
		},false);



		//监听播放
		loadedAudio.addEventListener("playing",function() {
			if(_this.device == 'ios')
			{
				loadedAudio.currentTime = _this.currentTime;//为了兼容IOS拖动进度条不会重新开始播放
			}
			_this._viewPause();
		},false);

		//监听暂停
		loadedAudio.addEventListener("pause",function() {
			_this._viewPlay();
		}, false);

	},

	__addAudioObj:function(url){
		var audioHtml = '<audio data-url="'+url+'" src="'+url+'" controls="controls" preload="auto" style="display:none">Your browser does not support the audio tag.</audio>';
		//var audioHtml = '<audio id="audio" controls="controls" style="display:none">Your browser does not support the audio tag.</audio>';
		this.container.append(audioHtml);


		var obj = $("[data-url='"+url+"']")[0];
		this.audios[url] = obj;

		this.__eventAudio(this.audios[url]);	

		return this.audios[url];
	},

	__loadIOSAudioObj:function(url){
		if(this.isEventAudio == 0)
		{
			var audioHtml = '<audio id="audio" controls="controls" style="display:none">Your browser does not support the audio tag.</audio>';
			this.container.append(audioHtml);
			this.audio = $("#audio")[0];
		}
		this.audio.src = url;

		if(this.isEventAudio == 0)
		{
			this.__eventAudio(this.audio);
			this.isEventAudio = 1;
		}
		return this.audio;
	},

	__loadAudio:function(){
		var _this = this;
		var isload = false;
		if(_this.device == 'ios')
		{
			_this.audio = this.__loadIOSAudioObj(_this.initParatemer.src);
		}else
		{
			_this.audio = _this.__loadAudioObj(_this.initParatemer.src);
		}
		

		if(typeof _this.initParatemer.loadAudio === 'function' )
		{
			_this.initParatemer.loadAudio();
		}

		if(_this.initParatemer.play)
		{
			if(_this.isWeixin())//在微信中IOS调用微信bridge可以自动播放
			{
				wx.ready(function(){
					_this.viewPause();
				});
				
				/*document.addEventListener("WeixinJSBridgeReady", function () { 
					_this.viewPause();
				}, false); */
			}else
			{
				_this.viewPause();
			}

		}else
		{
			_this.viewPlay();
		}

		//可以播放的时候
		/*this.audio.addEventListener("canplay",function(){
			if(_this.initParatemer.play)
			{
				_this.viewPause();
			}
		},false);*/

		//if(this.isLoad == 1) return;
		//if(this.isLoadAudio == 1) return;

		

	},

	__loadView:function(){
		var _this = this;
	
		this.viewProgress = $("#progress");
		this.viewProgressBtn = $("#qplayer-progress-btn");
		this.viewProgressBg = $("#qplayer-bg-blue");
		this.viewCurrentTime = $("#current_time");
		this.viewCurrentTime.html("00:00");
		this.viewProgressBtn.css('left','0px');
		this.viewProgressBg.css("width","0%");


		this.viewProgressBtn.draggable({
			axis:'x',
			containment: ".qplayer-progress",
			start:stopPlay,
			stop: viewGetPos
		});


		function viewGetPos()
		{
			var radio = _this.viewGetPos();
			var ctime = _this.duration * radio;
			_this.setTime(ctime);
		}

		function stopPlay(){
			_this.pause();
		};

		//手机端拖动功能
		this.viewProgressBtn[0].addEventListener('touchstart',touch, false);
		this.viewProgressBtn[0].addEventListener('touchmove',touch, false);
		this.viewProgressBtn[0].addEventListener('touchend',touch, false);
		var left = this.viewProgress[0].offsetLeft;
		function touch (event){
			var event = event || window.event;
			var btnleft = 0;
			var pwidth = _this.viewProgressWidth;
			switch(event.type){
				case "touchstart":
					stopPlay();
					break;
				case "touchend":
					viewGetPos();
					break;
				case "touchmove":
					event.preventDefault();
					btnleft = event.touches[0].clientX - left>=0 ? event.touches[0].clientX - left : 0;
					btnleft = event.touches[0].clientX - left>=pwidth ? pwidth - 10 : event.touches[0].clientX - left;
					if(btnleft < 0) btnleft = 0;
					_this.viewProgressBtn.css('left',btnleft+'px');
					break;
			}
		}


		//this.draggable();
	},

	getAudio:function(){
		return this.audio;
	},

	isIOS:function()
	{
		var u = navigator.userAgent;
		var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
		if(isIOS)
		{
			this.device = 'ios';
		}
	},

	isWeixin:function(){
		var ua = window.navigator.userAgent.toLowerCase();
		if(ua.match(/MicroMessenger/i) == 'micromessenger'){
			return true;
		}else{
			return false;
		}
	},

	viewPlay:function(){
		if(typeof this.initParatemer.playpause === 'function' )
		{
			this.initParatemer.playpause();
		}
		this._viewPlay();
		this.pause();
	},
	viewPause:function(){
		if(typeof this.initParatemer.playstart === 'function' )
		{
			this.initParatemer.playstart();
		}
		this.viewLoadShow()//;
		if(this.isEnd == 1)//结束后播放样式初始化
		{
			this.setTime(0);//重置时间为0
			this.isEnd = 0;
			this.viewProgressBtn.css('left','0px');
			this.viewProgressBg.css("width","0%");
		}
		this._viewPause();
		this.play();
	},

	_viewPlay:function(){
		if(this.viewPlayShow == 'play') return false;
		this.viewPlayShow = 'play';
		$(".qplayer-play-ico").removeClass("qplayer-pause-ico");
		$(".qplayer-play-text").html("播放");
		$("#play_pause").show();
	},
	_viewPause:function(){
		if(this.viewPlayShow == 'pause') return false;
		this.viewPlayShow = 'pause';
		$(".qplayer-play-ico").addClass("qplayer-pause-ico");
		$(".qplayer-play-text").html("暂停");
		$("#play_pause").hide();
	},

	//显示加载
	viewLoadShow:function(){
		$("#play_loading").show();
	},
	//隐藏加载
	viewLoadHide:function(){
		$("#play_loading").hide();
	},

	viewGetPos:function(){
		var radio = parseFloat(this.viewProgressBtn.css("left")) / this.viewProgressWidth;
		this.viewProgressBg.css("width",radio * 100 + "%");
		return radio;
	},

	//载入元数据后需要执行的方法
	loadedmetadata:function(func){
		this.audio.addEventListener("loadedmetadata",function() {
			if(typeof func === 'function' )
			{
				func();
			}
		},false);
	},

	//载入课件
	loadware:function(time){
		if(typeof(this.ware)=="undefined") return false;
		var ware = this.ware;
		for(var i in ware)
		{
			if(time >= ware[i].time)
			{
				if(this.currentWare != ware[i].pic)
				{
					//console.log(time+"changepic"+this.currentWare+"---"+ware[i].pic);
					this.currentWare = ware[i].pic;
				}
			}
		}
		$("#qplayer-ware").attr("src",this.currentWare);
	},

	//设置课件
	setWare:function(ware){
		if(typeof(ware)=="undefined") return false;
		this.ware = JSON.parse(ware);
		var ware = this.ware;
		var sortware=new Array()
		var leng = ware.length;
		//if(!leng) return false;
		for(var j = 0;j<leng;j++)
		{
			var key = '';
			var tem = null;
			for(var i in ware)
			{
				if(tem == null)
				{
					tem = parseInt(ware[i].time,10);
					key = i;
				}else if(parseInt(ware[i].time,10) < tem)
				{
					tem = parseInt(ware[i].time,10);
					key = i;
				}
			}
			sortware[j] = ware[key];
			ware.splice(key,1);
		}
		if(typeof sortware[0] == 'undefined' || sortware[0].time != 0)
		{
			var first = new Object();
			first.time = 0;
			first.pic = this.initParatemer.pic;
			sortware.unshift(first);
		}
		$("#qplayer-ware").attr("src",sortware[0].pic);
		this.ware = sortware;
	},

	jumpTime:function(ctime){
		var radio = ctime/this.duration;
		var _this = this;
		this.viewProgressBtn.css("left",this.viewProgressWidth * radio);
		this.setTime(ctime);
		
	},

	//更新显示时间
	viewTimeUpdate:function(ctime){
		ctime = parseInt(ctime,10);

		if(ctime - parseInt(this.currentTime,10) >0)
		{
			var left = this.viewProgressBtn.css('left');
			left = parseFloat(left);
			left = left + this.viewProgressPerWidth;
			if(left <= this.viewProgressWidth)
			{
				this.viewProgressBtn.css('left',left+'px');
				this.viewGetPos();
			}
			this.loadware(ctime);
		}
		if(this.timeSort == 'desc')
		{
			var time = this.duration - ctime;
		}else
		{
			var time = ctime;
		}
		if(time < 0) return;
		this.viewCurrentTime.html(this.formatViewTime(time));
	},

	//格式化显示时间
	formatViewTime:function(time){
		var x,y,timestr;
		if(time > 60)
		{
			x = parseInt(time/60,10);
			y = parseInt(time%60,10);
		}else
		{
			x = 0;
			y = parseInt(time,10);
		}
		if(y<10)
			y = "0" + y;
		if(x < 10)
		{
			timestr = "0" + x + ":" + y;
		}else{
			timestr = x + ":" + y;
		}
		return timestr;
	},


	setCookie: function(c_name,value,expiredays,domain){
		var exdate=new Date();
		exdate.setDate(exdate.getDate()+expiredays);
		document.cookie=c_name+ "=" +escape(value)+";path=/;domain="+domain+
			((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
	},

	getCookie: function(name){
		var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
		if(arr=document.cookie.match(reg))
			return unescape(arr[2]);
		else
			return null;
	},

	//记录播放时间
	recordCurrentTime: function(){
			var end = 0;
			if(this.duration && this.duration - this.audio.currentTime < 1)//是否结束
			{
				end = 1;
			}
			this.setCookie(this.cookiename,this.initParatemer.sort + '-' +this.initParatemer.id + '-' + this.audio.currentTime + '-' + end,30,this.host);
	},

	pause: function(){
		this.audio.pause();
	},
	play: function(){
		this.audio.play();
	},
        getLastTime: function(){
		//this.audio.currentTime = this.getCookie(this.cookiename);
		return this.getCookie(this.cookiename);
	},
	getCurrentTime:function(){
		return this.currentTime;
	},
	getTotalTime:function(){
		return this.audio.duration;
	},
	setTime:function(time){
		this.isEnd = 0;
		var _this = this;
		this.audio.pause();
		this.currentTime = time;//ios中第一次拉动进度条不能成功所以这里做个兼容处理到播放的时候设置进度条
		this.audio.currentTime = time;
		this.viewCurrentTime.html(this.formatViewTime(this.duration - time));
	}
};
