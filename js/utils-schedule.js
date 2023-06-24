


function goToState(num,skipAnim) {
	if ( !isMobile() && num <= currentState ) {
		return;	
	}
	duration = 500;
	if ( typeof skipAnim !== 'undefined' && skipAnim ) 
		duration = null;
	
	if ( currentState != num ) {
		prev = currentState;
		if ( num != 1  ) 
			$('.state-'+prev+'-intro' ).switchClass( "state-"+prev+"-intro", "state-"+num+"-intro",duration );
			
		$('.state-'+prev+'-search-options' ).switchClass( "state-"+prev+"-search-options", "state-"+num+"-search-options",duration );
		$('.state-'+prev+'-search-results' ).switchClass( "state-"+prev+"-search-results", "state-"+num+"-search-results",duration );
		$('.state-'+prev+'-leftcol' ).switchClass( "state-"+prev+"-leftcol", "state-"+num+"-leftcol",duration );
		$('.state-'+prev+'-rightcol' ).switchClass( "state-"+prev+"-rightcol", "state-"+num+"-rightcol",duration );
		$('.state-'+prev+'-addcustom' ).switchClass( "state-"+prev+"-addcustom", "state-"+num+"-addcustom",duration );
		
		$('.sm-nav li').removeClass("active");
		$('#sm-state-'+num).addClass("active");
		currentState = num;
		if ( num == 3 ) {
			sched_view('week');	
		}
	}
}

function isMobile() {
    return $('.visible-xs').is(':visible');
}

function launchDialog(dialogTempl, data) {
	dialogHtm = render(dialogTempl,data);
	$("#dialogInner").html(dialogHtm);
	$('#mainDialog').modal('show');
}

function addCustom() {
	var selected = [];
	$('#dayboxes input:checked').each(function() {
		selected.push( $(this).attr('value'));
	});

	c = new CustomBlock($('#ci-title').val(), selected.join(","), $('#ci-from').val(), $('#ci-to').val() );
	if ( c.isValid() ) {
		plans.getCurrent().addCustom(c);	
		$( "#mainDialog" ).modal( "hide" ); 
	}

	return void(0);
}


function addPrebuilt() {
	selected = $('#presched').val();
 
 	loading();
	ws('prebuilt/list/',selected,function (data) {
		doneloading();
		report = '';
		for (let k=0; k < data.results.blocks.length; k++ ) {
			block = data.results.blocks[k];
			let c = new CustomBlock( block.title, block.dow, block.tmfrom, block.tmto );
			let errors = c.isValid(1);
			if ( errors == '' ) {
				plans.getCurrent().addCustom(c);	
				report += '<li>Added: "' + block.title + '" on '+block.dow+', '+block.tmfrom +' to '+ block.tmto; 
			} else {
				report += '<li><strong>ERROR - could not add  "' + block.title+'"</strong> on '+block.dow+', '+block.tmfrom +' to '+ block.tmto+'. '+errors;	
			}

		}
		
		launchDialog('dialog-generic',{
			title:"Schedule imported",
			message:'<ul>'+report+'</ul>',
			buttons: [
				{ "btn-type": "default", "btn-text": "ok" },

			  ]
		} );
		
	});
}


function login() {
	if (persisted.hasSeenDisclaimer() ) {
		addDebug("login:"+ window.loginURL);
		location.href = window.loginURL;
	} else {
		launchDialog('dialog-generic', {title: "Important! Read this first",
			message:"Even though you can log in to save your schedule, CourseAvail is not connected to eCampus in any way. This system does not have access to pre-requisites you may have taken or permission to enroll you may have been granted. The information given in CourseAvail is simply for your planning purposes only. Official registration is still done in eCampus. ",
			buttons: [ { "btn-type": "primary", "btn-text": "OK, Got it", "btn-action": "disclaimerRead();login();"} ] });
	}
}

function disclaimerRead() {
	persisted.setShownDisclaimer();
}

function addParam(nm) {
	$( ".prototype_"+nm ).appendTo( "#advSearchOpts" );
}

function casOverlap(a, b, debug) {	
	debug = def(debug,false);
	for (var day in a) {
		if (a.hasOwnProperty(day) && b.hasOwnProperty(day)) {
			for(var r=0; r < a[day].length; r++) {		
				for(var k=0; k < b[day].length; k++) {		
					beginA = a[day][r][0];
					endA = a[day][r][1];
					beginB = b[day][k][0];
					endB = b[day][k][1];
					if ( debug )
						console.log(day+': ' + beginA + '-'+endA + ' and ' + beginB+'-'+endB);
	
                    //(StartA <= EndB) and (EndA >= StartB)
                    if ( beginA < endB && endA > beginB ) {
						return true;	
					}
                    
                    
				
					
				}
			}
		}
	}	
	
	return false;
}

function sched_view(which) {
	if ( which == 'week') {
		//google maps api has a bug which causes the map to break if you set it to display:none
		$('#sched-map-container').css('opacity','0');
		$('#week-container').fadeIn(); 
		
		$('#weekBtn').addClass('active');
		$('#mapBtn').removeClass('active');
	} else {
    	$('#week-container').fadeOut('fast',function() {  
			$('#sched-map-container').css('opacity','1');
			$('#weekBtn').removeClass('active');
			$('#mapBtn').addClass('active');
		 });
	}
}


function markDay(d,to) {
	if( to == 'y') 
		$('#day-'+d).removeClass("btn-default").removeClass("btn-danger").addClass("btn-success");
	else if( to == 'n') 
		$('#day-'+d).removeClass("btn-default").removeClass("btn-success").addClass("btn-danger");
	else
		$('#day-'+d).removeClass("btn-success").removeClass("btn-danger").addClass("btn-default");
	$('#advDaysReq').val('');
	$('#advDaysNot').val('');
	$('.daybtn.btn-success').each(function() { 
		v = $('#advDaysReq').val();
		let comma = '';
		if(v !== '' ) {
			comma = ',';
		}
		$('#advDaysReq').val(v+comma+$(this).data('day') );
	});	
	$('.daybtn.btn-danger').each(function() { 
		v = $('#advDaysNot').val();
		let comma = '';
		if(v !== '' ) {
			comma = ',';
		}
		$('#advDaysNot').val(v+comma+$(this).data('day') );
			
	});	
	searches.rebuildAdvancedSummary();
	return void(0);
}

function collapseAdv() {
	$('#advSearchOpts').hide();
	return void(0);
}
function showAdv() {
	$('#advSearchOpts').show();
	currentTerm = term + '';
	if (currentTerm.slice(-2) !== '60') { $('#summerSession').hide(); } else { $('#summerSession').show(); }
	return void(0);
}
function clearAdv(toclear) { //if the param is undefined, we clear all 
	toclear = def(toclear,'');
	if (toclear == '') { //clear all fields
		$('#oneSearch').val('');
		selector = '.adv';
		$('#advSeats').prop('checked',false);
	} else {
		selector = '#'+toclear;		
	}
	if ( toclear == 'advDaysReq' || toclear == '') {
		$('.daybtn.btn-success').removeClass("btn-success").addClass("btn-default");
	} 
	if ( toclear == 'advDaysNot' || toclear == '' ) {
		$('.daybtn.btn-danger').removeClass("btn-danger").addClass("btn-default");
	} 
	$(selector).val('');
	searches.rebuildAdvancedSummary();
}

function launchCustomMdl(elmt) {
	if ( elmt ) {
		dayClicked = $(elmt.currentTarget).data('day');
		hrClicked = $(elmt.currentTarget).data('hr');
		data = {hr:hrClicked};
		data['hr'+dayClicked] = 1;
	} else {
		data = {};	
	}
	launchDialog('dialog-addCustom',data);

}

function launchPrebuiltMdl(elmt) {
	loading();
	ws('prebuilt/',null,function (data) {
		doneloading();
		launchDialog('dialog-addPrebuilt',data.results);
	});
	

}

/**********************************************/
function schedule_init() {	
	//window.schedmap = new GoogleMap('sched-map-container');
	
	window.currentState = 1;
	buildWeekHTML();
	window.toggleClicked = false;
	
	$('#daySelectors').html( render('templ-daySelector',{daycode:'Sun',dayshort:'Su',daylong:'Sunday'})+
							 render('templ-daySelector',{daycode:'Mon',dayshort:'Mo',daylong:'Monday'})+
							 render('templ-daySelector',{daycode:'Tue',dayshort:'Tu',daylong:'Tuesday'})+
							 render('templ-daySelector',{daycode:'Wed',dayshort:'We',daylong:'Wednesday'})+
							 render('templ-daySelector',{daycode:'Thu',dayshort:'Th',daylong:'Thursday'})+
							 render('templ-daySelector',{daycode:'Fri',dayshort:'Fr',daylong:'Friday'})+
							 render('templ-daySelector',{daycode:'Sat',dayshort:'Sa',daylong:'Saturday'}) );
	 
	$('#oneSearch').on("click focus",function(e) {
		$('#recentsearchesCont').show();
		collapseAdv();
		e.stopPropagation();
	});		
	$('#oneSearch').keypress(function(e) {
		$('#recentsearchesCont').hide();
		if(e.which == 13) {
			searches.execute();
		}
	});		
	
	$('.daybtn.dropdown-toggle').click(function(e) {
		window.toggleClicked = true;
	});		
	$('#advSearchOpts').click(function(e) {
		if ( !window.toggleClicked ) {
			e.stopPropagation();
		}
		window.toggleClicked = false;
	});		
	


	$(document).click(function(e) {
		$('#recentsearchesCont').hide();
		$('#advSearchOpts').hide();
	});	



	if (persisted.getSearches() != '' ){
		searches.buildFromSerialized(persisted.getSearches());
		searches.rebuildRecentList();
	}
		
		
	$.ajax({ url: window.wsroot + "/autocomplete/"+term+"/"+career+"/courses", 
          success: function( data ) {
			window.ac_courses = data.results;  
           	$( "#oneSearch" ).autocomplete({  
				source: function (request, response) {
							var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i"), results = [];
							
							$.each( window.ac_courses, function (i, value) {
								if (matcher.test(value.value) || matcher.test(value.label) || matcher.test(value.subject)) {
									results.push({value:value.value,label: value.label});
								}
							});														
							response(results);
						},
				select: searches.execute_autosel,
				search: function(oEvent, oUi) {
							var sValue = $(oEvent.target).val();
							var dept = $('#advSubject').val();
							var school = $('#advSchool').val();
							var aSearch = [];
							if ( dept != '' ) {
								$(window.ac_courses).each(function(iIndex, sElement) {
									if (sElement.d == dept) {
										aSearch.push(sElement);
									}
								});	
								$(this).autocomplete('option', 'source', aSearch);
							} else if ( school != '' ) {
								$(window.ac_courses).each(function(iIndex, sElement) {
									if (sElement.s == school) {
										aSearch.push(sElement);
									}
								});	
								$(this).autocomplete('option', 'source', aSearch);
							}
						}
			 });
        }});							
		
		
	$.ajax({ url: window.wsroot + "/autocomplete/"+term+"/pathways", 
	  success: function( data ) {
		selInp = $('#advCore');
		selInp2 = $('#advCore2');
		$.each(data.results,function(key, o) {
			opt = '<option value="' + o.label + '">' + o.label + '</option>';
			selInp.append(opt);
			selInp2.append(opt);
		});
	}});	
	
	$.ajax({ url: window.wsroot + "/autocomplete/"+term+"/departments", 
	  success: function( data ) {
		selInp = $('#advSubject');
		if (data.results) {
			distinctDepts = [];
			//the WS returns duplicates (since a dept can be in more than one school) so we need to make them unique here			
			$.each(data.results,function(key, o) {
				if (distinctDepts.hasOwnProperty(o.value)) {
					distinctDepts[o.value].school += ' sc-'+ o.school;
				} else {
					distinctDepts[o.value] = {school:'sc-'+ o.school,label: o.label};	
				}
			});

			for (var k in distinctDepts){
				if (distinctDepts.hasOwnProperty(k)) {
					 //alert("Key is " + k + ", value is" + target[k]);
					 selInp.append('<option value="' + k + '" class="'+distinctDepts[k].school+'">' + distinctDepts[k].label + '</option>');
				}
			}
		}
	}});	
	if ( !plans.isEmpty() ) {
		plans.currentPlanID = 0;
		goToState(3,true);
		plans.goToPlanNum(0);	
	}
	buildTimeSelects();
	
	if (!window.listeningResize) {
		$( window ).resize(function() {plans.hideTabsOverflow(); });
		window.listeningResize =true;
	}
	
	$('.hrbc').click(launchCustomMdl);

	if ( window.career == 'grad' ) {
		$('.ugradonly').hide();	
	} else {
		$('.ugradonly').show();	
	}

}
