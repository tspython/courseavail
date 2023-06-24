window.onpopstate = function(event) {
	var page = getUrlParameter('p');
	var state = event.state;

	addDebug('onpopstate');
	
	window.searches = new Searches('searches-container');
	persisted.setPage(page);	
	goToPage(page ,false,function() {
		if ( state && state.action == 'search') {
			searches.populateFormParams(state.params);
			searches.execute(false);		
		}
	});		
}

window.onunload = function (event) {
	addDebug("unload- "+  plans.serialize(false,true) );
	$.cookie('ca2-dhist', JSON.stringify(debugHist), { expires: 45 } );
}

function doPushState(name,args) {
//	addDebug('pState:'+name.substring(0,6));
	history.pushState(args, 'CourseAvail',  name);
}

function doReplaceState(name,args) {
	history.replaceState(args, 'CourseAvail',  name);
}

function addDebug(str) {
	try {
		debugHist.unshift(str);
		debugHist.splice(30);	
	} catch (e) { console.log(e);}
}

function goToPage(name,addHist,callbackFunc) {
	addDebug('page:'+name.substring(0,3));

	addHist = typeof addHist !== 'undefined' ?  addHist : true;
	if ( pages.indexOf(name) == -1 ) {		
		console.log('invalid page ' + name);			
		name = defaultPage;	
	}
	
	persisted.setPage(name);
	
	let preventCache = (location.host=='www-dev.scu.edu'? '?'+Math.random():'');
	$.get(pageroot+"page-"+name+".html" +preventCache, function(tems) {
		$('.tpmi').removeClass('active');
		$('.tpmi a').blur();
		$('#menu-'+name).addClass('active');
		$('#main').html(tems);
		if (typeof window[name+'_init'] == 'function') { 
			window[name+'_init']();
		}
		if ( callbackFunc ) 
			callbackFunc();

	});	
	if (addHist) {
		doPushState('?p='+name);
	}
	return void(0);
}

function startOver(warned) {
	addDebug('startOver:'+warned);
	if (!warned  ) {
		launchDialog('dialog-generic',{
			title:"Are You Sure?",
			message:"This will clear any course selections you've added to plans and reset all preferences. Are you sure you want do proceed?",
			buttons: [
				{ "btn-type": "default", "btn-text": "cancel" },
				{ "btn-type": "primary", "btn-text": "Yes, Start Over", "btn-action": "startOver(true);"}
			  ]
		});
	} else {		
		persisted.clearAll();
		location.reload();
	}
	return void(0);
}

function isLoggedIn() {
	if (window.user != '') {
		return true;
	}
	return false;	
}

function ws(endpoint,args,donefunc,method,useterm,usecareer,async) {

	var method = def(method,'get');
	var useterm = def(useterm, window.term);
	var usecareer = def(usecareer, window.career);
	var async = def(async, true);

	req = {  async: async, 
		error: function(d) {
			doneloading();
			console.log("error data", d);
			error("We're sorry, an error was encountered. Please refresh the page and try again");
		},
		success: function(d) { 
			doneloading(); 
			if ( d.title == 'error' ) {
				console.log("error", d);
				error("We're sorry, an error was encountered. Please refresh the page and try again ("+d.results+")");
			} else {
				if ( donefunc) 	{
					donefunc(d); 
				}
			}
		}
	};
	loading();

	if ( method == 'get' ) {
		if ( !Array.isArray(args) ) {
			args = [args];	
		}				
		req['url'] = window.wsroot + "/"+endpoint+'/'+useterm+'/'+usecareer+'/'+args.join("/");		
	} else {
		req['type'] = "POST";
		req['url'] = window.wsroot + "/"+endpoint+'/'+useterm+'/'+usecareer;
		req['data'] = args;
	}
	
	$.ajax(req);	
		
}

function chooseSubjects(elmt,srcSel,targetSel) {
	var val = $(elmt).val();

	if ( val =='' ) {

		$('#'+targetSel+' option').show();
	} else {

		$('#'+targetSel+' option').hide();

		$('.sc-'+val).show();		
	}
}
	
function render(templateid, data) {
	/*this function parses and calls templates from mustache-template.html */
	var templateScr = document.getElementById(templateid);
	if ( templateScr == null ) {
		console.log('Error: could not find template: '+templateid);	
		return '';
	}
	// console.log('Data passed to template:', templateid);
	// console.log(data);
	var templateCode = templateScr.innerHTML;
	
	Mustache.parse(templateCode);
	return Mustache.render(templateCode,data);	
}

function parseTime(timeString) {    
    if (typeof timeString == 'undefined' || timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i); 
    if (time == null) return null;

    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }   
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);  
    return d;
}

function error(e,title) {
	launchDialog('dialog-error', {message: e, title: title });	
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function def(val,defaultval) {
  var defaultval = typeof defaultval !== 'undefined' ?  defaultval : '' ;
  var val = typeof val !== 'undefined' && val != null ?  val : defaultval;
  return val;	
}

function loading() {
	$('#load').fadeIn();	
}
function doneloading() {
	$('#load').fadeOut();	
}

function lb(content,opts) {
	opts = def(opts,{});
	$('#mylightbox').html(content);
	$.featherlight('#mylightbox', opts);
}
function closeLB() {
	$.featherlight.close();
	return void(0);	
}
function json_parse(jsonTxt) {
    try {
        var ob = JSON.parse(jsonTxt);
        return ob;
    } catch (e) {
        return false;
    }

}

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
	return null;
};


/**
 * Calculate a 32 bit FNV-1a hash
 * Found here: https://gist.github.com/vaiorabbit/5657561
 * Ref.: http://isthe.com/chongo/tech/comp/fnv/
 *
 * @param {string} str the input value
 * @param {boolean} [asString=false] set to true to return the hash value as 
 *     8-digit hex string instead of an integer
 * @param {integer} [seed] optionally pass the hash of the previous chunk
 * @returns {integer | string}
 */
function hash(str, asString, seed) {
    /*jshint bitwise:false */
    var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if( asString ){
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}

function selectCareer(c) {
	if ( c == 'grad' ) {
		$('.ugradonly').hide();	
	} else {
		$('.ugradonly').show();	
	}
	$('#careerff').val(c);	

	if ( c != persisted.getCareer() ) {
		persisted.setCareer(c);
	}
	updateCareerBtns();
	return void(0);
}
function updateCareerBtns() {

	$('.careerbtns .active').removeClass('active');
	$('#career_'+window.career).addClass('active');
	

	if ( persisted.getCareer() == 'ugrad' ) {
		$('#selectedCtext').html('Undergrad');
	} else if  ( window.career == 'grad' ) {
		$('#selectedCtext').html('Grad');
	} else {
		$('#selectedCtext').html('All');
	}
}

function savedPopper() {
	$('.savedNotif').fadeIn( ).delay( 600 ).fadeOut(  );
}


function deserializeQS(queryString) {
  if(queryString.indexOf('?') > -1){
    queryString = queryString.split('?')[1];
  }
  var pairs = queryString.split('&');
  var result = {};
  pairs.forEach(function(pair) {
    pair = pair.split('=');
    result[pair[0]] = decodeURIComponent(pair[1] || '');
  });
  return result;
}

function buildTimeSelects() {
	var st = $('#advStTime');		
	var et = $('#advEnTime');		
	for ( var i =7; i <= 21; i++ ) {
		if ( i ==12 ) {	
			var dts = '12pm';
		} else if ( i <=12 ) {	
			var dts = i+'am';
		} else {
			var dts = (i-12)+'pm';
		}
		st.append('<option value="' + dts + '">' + dts + '</option>');
		et.append('<option value="' + dts + '">' + dts + '</option>');
		
	}	
}

function launchShare() {
	var sharelink = 'https://'+window.location.hostname+window.location.pathname+'?';	
	sharelink += 'shared='+encodeURIComponent(JSON.stringify(plans.getCurrent().serialize()));

	launchDialog('dialog-generic', {message: '<div id="slink"><i class="fa fa-spinner fa-spin"></i> loading&hellip;</div>', title: 'Share with Others'});	
	var txt = render('templ-share',{link:sharelink , quarter: termhr, planname: plans.getCurrent().getName() } );
	$('#slink').html(txt);
	$("#sharelink").click(function () {
	   $(this).select();
	});
	return void(0);	
}


function buildWeekHTML() {
	str='';
	days = [{fr:"Sun",code:"U",c:'colHide'},
			{fr:"Mon",code:"M"},
			{fr:"Tue",code:"T"},
			{fr:"Wed",code:"W"},
			{fr:"Thu",code:"R"},
			{fr:"Fri",code:"F"},
			{fr:"Sat",code:"S",c:'colHide'}];
			
	//left side time column 
	str += '<div id="" class="col-md-1 timecol">';
	str += '	<div class="text-center"><strong>&nbsp;</strong></div>';
	str += '	<div class="timegrid">';
		
		for ( var k = 7 ; k < 21; k ++ ) {
			if ( k ==12 ) 	dts = 'Noon';
			else if ( k <=12 ) 	dts = k+' am';
			else 			dts = (k-12)+' pm';
			
			str += '	<div class="'+(k%2==0?'timeblock_blank':'timeblock')+' text-right" data-hr="'+dts+'">'+dts+'</div>';
		}
	str += '</div></div>';
			
	for ( var i = 0 ; i < days.length; i ++ ) {
		d = days[i];
		str += '<div id="day_'+d.fr+'" class="col-md-1 daycol '+d.c+'">';
		str += '	<div class="text-center dayheading">'+d.fr+'</div>';
		str += '	<div class="daygrid" id="col_'+d.fr+'">';
		
		for ( var k = 7 ; k < 21; k ++ ) {
			if ( k ==12 ) 	dts = '12pm';
			else if ( k <=12 ) 	dts = k+'am';
			else 			dts = (k-12)+'pm';
			
			str += '	<div class="'+(k%2==0?'hourblock_blank':'hourblock')+' hrbc" data-day="'+d.fr+'" data-hr="'+dts+'"></div>';
		}
		str += '</div></div>';
	}
	
	//right side time column 
	str += '<div id="" class="col-md-1 timecol">';
	str += '	<div class="text-center"><strong>&nbsp;</strong></div>';
	str += '	<div class="timegrid">';
		
		for ( var k = 7 ; k < 21; k ++ ) {
			if ( k ==12 ) 	dts = ' Noon';
			else if ( k <=12 ) 	dts = k+' am';
			else 			dts = (k-12)+' pm';
			
			str += '	<div class="'+(k%2==0?'timeblock_blank':'timeblock')+'" data-hr="'+dts+'">'+dts+'</div>';
		}
	str += '</div></div>';

	$('#week-container').html(str);	
}

$.cssHooks.bg = {
    get: function(elem) {
        if (elem.currentStyle)
            var bg = elem.currentStyle["backgroundColor"];
        else if (window.getComputedStyle)
            var bg = document.defaultView.getComputedStyle(elem,
                null).getPropertyValue("background-color");
        if (bg.search("rgb") == -1)
            return bg;
        else {
            bg = bg.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return hex(bg[1]) + hex(bg[2]) + hex(bg[3]);
        }
    }
}

function floormap(id,target) {
	target = def(target,'lb');
	
	
	ws("location",id,function(data) {
		if ( data.title == 'authRequired' ) {
			location.href = data.results.loginURL;
		} else {
			htm = render('templ-floorMap',data.results);	
			if ( target == 'lb' ) {
				lb(htm);
			} else {
				target.html(htm);
			}
		}
	});
}

function sendBugReport() {
	em = $('#sb_email').val();
	det = $('#sb_detail').val();
	tgt = $('.sb_target:checked');

	errors = '';
	if ( em == '' ) {
		errors+= '<li>Please enter your email address';
	}
	if ( det == '' ) {
		errors+= '<li>Please enter a question or a description of your problem';
	}
	if ( tgt.length == '' ) {
		errors+= '<li>Please indicate whether your report is a technical issue or a registrar question';
	}
	
	if (errors != '' ) {
		$('#sbErrors').html('<ul>'+errors+'</ul>').show();	
	} else {
		packed = {
			email: em,
			details: det,
			target: tgt.val(),
			debug: JSON.stringify({plans:plans.serialize(),debug:debugHist}),
			'g-recaptcha-response': $('#g-recaptcha-response').val()
		 };	

		ws('support',packed,function(data){
			doneloading();
			if ( data.title == 'error' ) {
				$('#sbErrors').html('<ul>'+data.results+'</ul>').show();	
			} else {
				$('#bugform').html(data.results);
				$('#bugformBtns').html('<button type="button" class="btn btn-primary" data-dismiss="modal">OK</button>');
					
			}
		},'post');		 
	}

	return void(0);

		
}

function gethelp() {
	loading();
	ws('help',null,function(data) {	
		launchDialog('dialog-submitBug',data);	
	})
}