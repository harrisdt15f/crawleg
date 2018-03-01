// 彩票开奖配置
exports.cp=[

	{
		title:'重庆时时彩',
		source:'360彩票',
		name:'cqssc',
		enable:true,
		timer:'cqssc_360',
		option: {
			host: 'cp.360.cn',
			timeout: 30000,
			path: '/ssccq/',
			headers: {'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0)'},
		},
		parse: function(str) {
			try{
				return getFrom360CP(str, 1); //後面的type為代碼
			} catch(err) {
				throw('重庆时时彩解析数据不正确');
			}
		},
	},
	{
		title:'北京PK10',
		source:'北京福彩网',
		name:'bjpk10',
		enable:false,
		timer:'bjpk10',
		option:{
			host:"www.bwlc.net",
			timeout:30000,
			path: '/bulletin/prevtrax.html',
			headers:{
				"User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0)"
			}
		},
		parse:function(str){
			try{
					var strlen=166;
					str=str.substr(str.indexOf('<th width="30%">开奖公告</th>'), strlen);
					var m;
					var reg=/<tr\D*(\d*)\D*([\d\,]*)\D*([\d\-\:\s]*)/;
					if(m=str.match(reg)){
						return {
							type:20,
							time:m[3],
							number:m[1],
							data:m[2],
							correct:true,
						};
					}
			}catch(err){
				throw('北京PK10解析数据不正确');
			}
		}
	},
];

// 出错时等待 15
exports.errorSleepTime=15;

// 重启时间间隔，以小时为单位，0为不重启
//exports.restartTime=0.4;
exports.restartTime=1;

exports.submit={

	host:'localhost',
	path:'/index.php/dataSource/kj'
}

exports.dbinfo={
	host:'localhost',
	user:'root',
    	password:'',// password:'gA~!@Ghangfjsx',
	database:'wanjinyule'
}

global.log=function(log){
	var date=new Date();
	console.log('['+date.toDateString() +' '+ date.toLocaleTimeString()+'] '+log)
}

function getFromXJFLCPWeb(str, type){
	// 2016-09-25 原本從list中取，但有跨日後tlist中的資料變成隔日後0085就取不到
	str=str.substr(str.indexOf('<div class="con_left con_left2" style="position:relative;"'), 500).replace(/[\r\n\t]+/g,'');
	// 2016-09-21 沒有時間，所以自建
	var myDate = new Date();
	var year = myDate.getFullYear();       //年
    var month = myDate.getMonth() + 1;     //月
    var day = myDate.getDate();            //日
	if(month < 10) month="0"+month;
	if(day < 10) day="0"+day;
	var mytime=year + "-" + month + "-" + day + " " +myDate.toLocaleTimeString();
	var reg=/[\s\S]*?<span>[\w\W\s\S](\d+)[\w\W\s\S]<\/span>[\s\S\w\W].*?<div[\s\S\w\W]*?kj_ball kj_ball_new">((?:[\s\S]*?<i>\d+<\/i>){5})[\s\S]*?<\/div>/,
	match=str.match(reg);
	if(!match) { log('解析新疆数据数据不正确' + str) };
	if(!match) throw new Error('数据不正确');
	if(match.length >1){
		try{
			var rule=match[1].replace(/ /,'').replace(/^(\d{8})(\d{2})$/, '$10$2');
			var numa=rule.substr(0,8);
			var numb=rule.substr(9,2);
			rule=numa+"-"+numb;
			var data={
				type:type,
				time:mytime, // 改為自行定義
				number:rule,
				correct:true // 20160921 告知不用處理
			}
			reg=/<i.*?>(\d+)<\/i>/g;
			data.data=match[2].match(reg).map(function(v){
				var reg=/<i.*?>(\d+)<\/i>/;
				return v.match(reg)[1];
			}).join(',');
			return data;
		}catch(err){
			throw('解析新疆数据失败');
		}
	}
}


function getFromCaileleWeb(str, type, slen){
	if(!slen) slen=500;
	str=str.substr(str.indexOf('<span class="cz_name">'),slen);
	//console.log(str);
	var reg=/<td.*?>(\d+)<\/td>[\s\S]*?<td.*?>([\d\- \:]+)<\/td>[\s\S]*?<td.*?>((?:[\s\S]*?<span class="red_ball">\d+<\/span>){3,5})\s*<\/td>/,
	match=str.match(reg);
	if(match.length>1){

		if(match[1].length==7) match[1]='2014'+match[1].replace(/(\d{4})(\d{3})/,'$1-$2');
		if(match[1].length==8){
			if(parseInt(type)!=11){
				match[1]='20'+match[1].replace(/(\d{6})(\d{2})/,'$1-0$2');
			}else{match[1]='20'+match[1].replace(/(\d{6})(\d{2})/,'$1-$2');}
		}
		if(match[1].length==9) match[1]='20'+match[1].replace(/(\d{6})(\d{2})/,'$1-$2');
		if(match[1].length==10) match[1]=match[1].replace(/(\d{8})(\d{2})/,'$1-0$2');
		var mynumber=match[1].replace(/(\d{8})(\d{3})/,'$1-$2');
	try{
		var data={
			type:type,
			time:match[2],
			number:mynumber
		}
		reg=/<div.*>(\d+)<\/div>/g;
		data.data=match[3].match(reg).map(function(v){
			var reg=/<div.*>(\d+)<\/div>/;
			return v.match(reg)[1];
		}).join(',');

		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}
   }
}

function getFrom360CP(str, type){
	str=str.substr(str.indexOf('<em class="red" id="open_issue">'),380);
	//console.log(str);
	var reg=/[\s\S]*?(\d+)<\/em>[\s\S].*?<ul id="open_code_list">((?:[\s\S]*?<li class=".*?">\d+<\/li>){3,5})[\s\S]*?<\/ul>/,
	match=str.match(reg);
	var myDate = new Date();
	var year = myDate.getFullYear();       //年
    var month = myDate.getMonth() + 1;     //月
    var day = myDate.getDate();            //日
	if(month < 10) month="0"+month;
	if(day < 10) day="0"+day;
	var mytime=year + "-" + month + "-" + day + " " +myDate.toLocaleTimeString();
	//console.log(match);
	if(match.length>1){
		if(match[1].length==7) match[1]=year+match[1].replace(/(\d{8})(\d{3})/,'$1$2'); // 时时彩
		if(match[1].length==6) {match[1]=year+match[1].replace(/(\d{4})(\d{2})/,'$1$2');var numa=match[1].substr(0,8);var numb=match[1].substr(8,2);match[1]=numa+"0"+numb;} // 广东11选5
		if(match[1].length==9) match[1]='20'+match[1].replace(/(\d{6})(\d{2})/,'$1$2');
		if(match[1].length==10) match[1]=match[1].replace(/(\d{8})(\d{2})/,'$1$2');
		var mynumber=match[1].replace(/(\d{8})(\d{3})/,'$1$2');
		var numfront=mynumber.substr(0,8);
		var numend=mynumber.substr(8,3);
		mynumber=numfront+"-"+numend;
		try{
			var data={
				type:type,
				time:mytime,
				number:mynumber
			}
			reg=/<li class=".*?">(\d+)<\/li>/g;
			data.data=match[2].match(reg).map(function(v){
				var reg=/<li class=".*?">(\d+)<\/li>/;
				return v.match(reg)[1];
			}).join(',');
			//console.log(data);
			data.correct=true; // 20160921 告知不用處理
			return data;
		}catch(err){
			throw('解析数据失败');
		}
	}
}

function getFrom360CPK3(str, type){

	str=str.substr(str.indexOf('<em class="red" id="open_issue">'),380);
	//console.log(str);
	var reg=/[\s\S]*?(\d+)<\/em>[\s\S].*?<ul id="open_code_list">((?:[\s\S]*?<li class=".*?">\d+<\/li>){3,5})[\s\S]*?<\/ul>/,
	match=str.match(reg);
	var myDate = new Date();
	var year = myDate.getFullYear();       //年
    var month = myDate.getMonth() + 1;     //月
    var day = myDate.getDate();            //日
	if(month < 10) month="0"+month;
	if(day < 10) day="0"+day;
	var mytime=year + "-" + month + "-" + day + " " +myDate.toLocaleTimeString();
	//console.log(match);
	match[1]=match[1].replace(/(\d{4})(\d{2})/,'$1$2');

		try{
			var data={
				type:type,
				time:mytime,
				number:match[1]
			}

			reg=/<li class=".*?">(\d+)<\/li>/g;
			data.data=match[2].match(reg).map(function(v){
				var reg=/<li class=".*?">(\d+)<\/li>/;
				return v.match(reg)[1];
			}).join(',');

			//console.log(data);
			return data;
		}catch(err){
			throw('解析数据失败');
		}
}

function getFromPK10(str, type){
	str=str.substr(str.indexOf('<td class="winnumLeft">'),350).replace(/[\r\n]+/g,'');
	var reg=/<td class=".*?">(\d+)<\/td>[\s\S]*?<td>(.*)<\/td>[\s\S]*?<td class=".*?">([\d\:\- ]+?)<\/td>[\s\S]*?<\/tr>/,
	match=str.match(reg);
	if(!match) throw new Error('数据不正确');
	var myDate = new Date();
	var year = myDate.getFullYear();
	var mytime=year + "-" + match[3];
	try{
		var data={
			type:type,
			time:mytime,
			number:match[1],
			data:match[2]
		};
		return data;
	}catch(err){
		throw('解析数据失败');
	}

}

function getFromK8(str, type){

	str=str.substr(str.indexOf('<div class="lott_cont">'),450).replace(/[\r\n]+/g,'');
    //console.log(str);
	var reg=/<tr class=".*?">[\s\S]*?<td>(\d+)<\/td>[\s\S]*?<td>(.*)<\/td>[\s\S]*?<td>(.*)<\/td>[\s\S]*?<td>([\d\:\- ]+?)<\/td>[\s\S]*?<\/tr>/,
	match=str.match(reg);
	if(!match) throw new Error('数据不正确');
	//console.log(match);
	try{
		var data={
			type:type,
			time:match[4],
			number:match[1],
			data:match[2]+'|'+match[3]
		};
		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}

}


function getFromCJCPWeb(str, type){

	//console.log(str);
	str=str.substr(str.indexOf('<table class="qgkj_table">'),1200);

	//console.log(str);

	var reg=/<tr>[\s\S]*?<td class=".*">(\d+).*?<\/td>[\s\S]*?<td class=".*">([\d\- \:]+)<\/td>[\s\S]*?<td class=".*">((?:[\s\S]*?<input type="button" value="\d+" class=".*?" \/>){3,5})[\s\S]*?<\/td>/,
	match=str.match(reg);

	//console.log(match);

	if(!match) throw new Error('数据不正确');
	try{
		var data={
			type:type,
			time:match[2],
			number:match[1].replace(/(\d{8})(\d{2})/,'$1-0$2')
		}

		reg=/<input type="button" value="(\d+)" class=".*?" \/>/g;
		data.data=match[3].match(reg).map(function(v){
			var reg=/<input type="button" value="(\d+)" class=".*?" \/>/;
			return v.match(reg)[1];
		}).join(',');

		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}

}

function getFromCaileleWeb_1(str, type){
	str=str.substr(str.indexOf('<tbody id="openPanel">'), 120).replace(/[\r\n]+/g,'');

	var reg=/<tr.*?>[\s\S]*?<td.*?>(\d+)<\/td>[\s\S]*?<td.*?>([\d\:\- ]+?)<\/td>[\s\S]*?<td.*?>([\d\,]+?)<\/td>[\s\S]*?<\/tr>/,
	match=str.match(reg);
	if(!match) throw new Error('数据不正确');
	//console.log(match);
	var number,_number,number2;
	var d = new Date();
	var y = d.getFullYear();
	if(match[1].length==9 || match[1].length==8){number='20'+match[1];}else if(match[1].length==7){number='2014'+match[1];}else{number=match[1];}
	_number=number;
	if(number.length==11){number2=number.replace(/^(\d{8})(\d{3})$/, '$1-$2');}else{number2=number.replace(/^(\d{8})(\d{2})$/, '$1-0$2');_number=number.replace(/^(\d{8})(\d{2})$/, '$10$2');}
	try{
		var data={
			type:type,
			time:_number.replace(/^(\d{4})(\d{2})(\d{2})\d{3}/, '$1-$2-$3 ')+match[2],
			number:number2,
			data:match[3]
		};
		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}
}

function getFrom360sd11x5(str, type){

	str=str.substr(str.indexOf('<em class="red" id="open_issue">'),380);
	//console.log(str);
	var reg=/[\s\S]*?(\d+)<\/em>[\s\S].*?<ul id="open_code_list">((?:[\s\S]*?<li class=".*?">\d+<\/li>){3,5})[\s\S]*?<\/ul>/,
	match=str.match(reg);
	var myDate = new Date();
	var year = myDate.getFullYear();       //年
    var month = myDate.getMonth() + 1;     //月
    var day = myDate.getDate();            //日
	if(month < 10) month="0"+month;
	if(day < 10) day="0"+day;
	var mytime=year + "-" + month + "-" + day + " " +myDate.toLocaleTimeString();
	//console.log(mytime);
	//console.log(match);

	if(!match) throw new Error('数据不正确');
	try{
		var rule=match[1].replace(/(\d{4})(\d{2})/,'$1$2');
		var ruleone=rule.substr(0,4);
		var ruletwo=rule.substr(4,2);
		rule=ruleone+"-0"+ruletwo;
		var data={
			type:type,
			time:mytime,
			number:year+rule
		}

		reg=/<li class=".*?">(\d+)<\/li>/g;
		data.data=match[2].match(reg).map(function(v){
			var reg=/<li class=".*?">(\d+)<\/li>/;
			return v.match(reg)[1];
		}).join(',');

		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}
}

function getFromCaileleWeb_2(str, type){

	str=str.substr(str.indexOf('<tbody id="openPanel">'), 500).replace(/[\r\n]+/g,'');
	//console.log(str);
	var reg=/<tr>[\s\S]*?<td>(\d+)<\/td>[\s\S]*?<td>([\d\:\- ]+?)<\/td>[\s\S]*?<td>([\d\,]+?)<\/td>[\s\S]*?<\/tr>/,
	match=str.match(reg);
	if(!match) throw new Error('数据不正确');
	//console.log(match);
	var number,_number,number2;
	var d = new Date();
	var y = d.getFullYear();
	if(match[1].length==9 || match[1].length==8){number='20'+match[1];}else if(match[1].length==7){number='2014'+match[1];}else{number=match[1];}
	_number=number;
	if(number.length==11){number2=number.replace(/^(\d{8})(\d{3})$/, '$1-$2');}else{number2=number.replace(/^(\d{8})(\d{2})$/, '$1-0$2');_number=number.replace(/^(\d{8})(\d{2})$/, '$10$2');}
	try{
		var data={
			type:type,
			time:_number.replace(/^(\d{4})(\d{2})(\d{2})\d{3}/, '$1-$2-$3 ')+match[2],
			number:number2,
			data:match[3]
		};
		//console.log(data);
		return data;
	}catch(err){
		throw('解析数据失败');
	}
}

function getFromfrgcsc(str, type){
	str=str.substr(str.indexOf('<th>开奖号码</th>'),380);
	//console.log(str);
	//var reg=/<th>[\s\S]*?<\/th>[\s\S]*?<\/tr>[\s\S]*?<\/thead>[\s\S]*?<tbody>[\s\S]*?<tr>[\s\S]*?<td>(\d+)<\/td>[\s\S]*?<td>([\d\,]+?)<\/td>[\s\S]*?<\/tr>/,
	var reg=/<th>[\s\S]*?<\/th>[\s\S]*?<\/tr>[\s\S]*?<\/thead>[\s\S]*?<tbody>[\s\S]*?<tr>[\s\S]*?<td>([\d+\-]+?)<\/td>[\s\S]*?<td>([\d\,]+?)<\/td>[\s\S]*?<\/tr>/,
	match=str.match(reg);
	//console.log(match);
	var myDate = new Date();
	var year = myDate.getFullYear();       //年
    var month = myDate.getMonth() + 1;     //月
    var day = myDate.getDate();            //日
	if(month < 10) month="0"+month;
	if(day < 10) day="0"+day;
	var mytime=year + "-" + month + "-" + day + " " +myDate.toLocaleTimeString();
	//console.log(match);
		var mynumber=match[1].replace(/(\d{8})(\d{3})/,'$1-$2');
		try{
			var data={
				type:type,
				time:mytime,
				number:mynumber,
				data:match[2]
			}
			return data;
		}catch(err){
			throw('解析数据失败');
		}
}