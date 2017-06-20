# qplayer
h5 audio player。该播放器特点是简单，只运用了h5的audio功能，无需flash。现在样式是内置好的，之后的版本可能会放到外部去
# Features
	集成H5 audio的播放器
	拖曳播放
	IOS微信中自动播放
	播放中的图片预设

```javascript
qPlayer.init($("#player_container"),{
			"src":'',//音频地址
			"next_src":'',//下一个播放音频用于预加载
			"playend":playend,//播放结束回调
			"playstart":playstart,//播放回调
			"playpause":playpause,//暂停回调
			"loadAudio":loadAudio,//载入回调
			"play":true,//是否自动播放
			"ware":'',//课件
			'pic':'',//图片
			});
```

# 建议与疑问
qiu2790@126.com
