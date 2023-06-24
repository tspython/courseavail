function PlanCollection () {
	this.allplans = [];
	this.currentPlanID = 0;
}


PlanCollection.prototype.getCurrent = function() {
	if ( this.allplans.length == 0 ) {
		this.allplans.push(new Plan(this.getNextDefaultName(),0));
		this.refreshButtons();
	}
	return this.allplans[this.currentPlanID];
}

PlanCollection.prototype.get = function(ind) {
	if ( ind < 0 || ind > this.allplans.length)
		return null;
    return this.allplans[ind];
};

PlanCollection.prototype.getNextDefaultName = function() {	
    return termhr.replace('20',"'") +' Plan '+(this.allplans.length+1);
};

PlanCollection.prototype.serialize = function(json,humanReadable) {
	json = def(json,false);
	humanReadable = def(humanReadable,false);
	var plansOb = [];
	var plansStr = '';
	for( w=0;w<this.allplans.length;w++) {	
		if ( humanReadable ) {		
			plansStr += (w>0?' | ':'')+this.allplans[w].serialize(json,humanReadable);
		} else {
			plansOb.push(this.allplans[w].serialize(json,humanReadable));	
		}
	}
	if ( humanReadable ) {	
		return plansStr;
	} else {
		return JSON.stringify(plansOb);	
	}
}


PlanCollection.prototype.buildFromSerialized = function(str,callback) {
	this.allplans = [];
	this.currentPlanID = 0;

	if ( str[0].courses ) {
		var thobj =str;
	} else {
		try {
			var thobj = JSON.parse(str);
		} catch (e) {
			return false;
		}	
	}
	allCourseIDs = [];	

	for( w=0; w<thobj.length; w++) {		
		this.allplans[w] = new Plan(thobj[w].name,w);
		this.currentPlanID = w;
		allCourseIDs = allCourseIDs.concat(thobj[w].courses);


		if ( thobj[w].custom.length > 0 ) {
			storedCust = thobj[w].custom;
			for( q=0; q < storedCust.length; q++) {		
				this.allplans[w].addCustom(new CustomBlock(storedCust[q].title,storedCust[q].days,storedCust[q].si,storedCust[q].ei),false);			
			}
				
		}

	}
	var pselfref = this;

	if ( allCourseIDs.length > 0 ) {
		ws("details",  allCourseIDs.join(),function(data) {
			localDB.insertCourses(data.results);
			
			//loop through plans
			for( p=0; p<thobj.length; p++) {		
				//loop through courses in this plan
				for( c=0; c< thobj[p].courses.length; c++) {		
					pselfref.allplans[p].addCourseBypass(thobj[p].courses[c],false);
				}
			}
			if ( typeof callback == 'function' )
				callback();
				
		});
	} else {
		if ( typeof callback == 'function' )
			callback();	
	}
}


PlanCollection.prototype.highlight = function(sectionUID,courseArray) {
///think this is deprecated
/*	

for( i=0;i<this.allplans.length;i++) {
		this.allplans[i].highlight();
	}
	$('.pendingTT').tooltip({});*/
	
}


PlanCollection.prototype.refreshButtons = function() {
	$('.planTab,.planTabDD').remove();
	for( var i=0;i<this.allplans.length; i++) {
		data= {id:i,name:this.allplans[i].getName(),active:(i==this.currentPlanID)};
		htm = render("templ-planTab",data);			
		if ( data.active ) { //move the active tab to first in the list, because it can't be in the "x more" dropdown
			$('#planTabs').prepend(htm);
			$('#planTabsMore').prepend('<li data-id="'+i+'" class="planTabDD"><a href="javascript:plans.goToPlanNum('+i+');">'+data.name+'</a></li>');
		
		} else {
			if ($('.planTab').length ) {
				$('.planTab:last').after(htm);
			} else {
				$('#planTabs').prepend(htm);
			}
			$('#planTabsMore').append('<li data-id="'+i+'" class="planTabDD"><a href="javascript:plans.goToPlanNum('+i+');">'+data.name+'</a></li>');
		}
		
	}
	this.hideTabsOverflow();
}


PlanCollection.prototype.hideTabsOverflow = function() {
	var totalWidth = $('#planTabs').width();
	var reqTabsWidth =   $('#addPlan').width();//$('#hiddenMore').width() +
	if ( totalWidth == 0 ) { //fix a bug when the page first loads and we can't get these elements. probably a better fix for this...todo
		totalWidth = $(window).width()/2;	
		reqTabsWidth = 78;
	}
	tabsWidth = reqTabsWidth;
	ctMore = 0;
	$('.planTab').each(function() {
		hmwid = $('#hiddenMore').width();
		tabsWidth += $(this).width();
		thisID = $(this).data('id');
		if ( (tabsWidth+hmwid) >= totalWidth ) {
			$(this).hide();
			$('#planTabsMore li[data-id="'+thisID+'"]').show();
			ctMore++;
		} else {
			$(this).show();	
			$('#planTabsMore li[data-id="'+thisID+'"]').hide();
		}
	});
	if (ctMore == 0)  {
		$('#hiddenMore').hide();	
	} else {
		$('#numMore').html(ctMore+' more');	
		$('#hiddenMore').show();	
	}
}


PlanCollection.prototype.go_step = function(step) {
	newstep = this.currentPlanID + step;
	this.goToPlanNum(newstep);
}

PlanCollection.prototype.goToPlanNum = function(n) {
	if ( n < 0 || n >= this.allplans.length) {
		return;
	}
	try {	
	this.allplans[this.currentPlanID].cancelRename();
	} catch (e) {}
	
	this.currentPlanID = n;
	this.refreshButtons();
	this.allplans[this.currentPlanID].display();
	searches.disableConflictsInResults();
	
}

PlanCollection.prototype.beginAdd = function() {
	numplans = this.allplans.length+1;


	prepop =[];
	for( i=0;i<this.allplans.length;i++) {
		prepop.push({ "name": this.allplans[i].getName(), id: i }); 
	}
	launchDialog('dialog-addPlan',{default:this.getNextDefaultName(),prepopulate:prepop})
	return void(0);
}

PlanCollection.prototype.addComplete = function() {

	prepopFrom = $('#prepop').val();
	newPlan = new Plan($('#nm').val(),this.allplans.length);
	if ( prepopFrom != '' ) {
		newPlan.populate(this.allplans[prepopFrom].courses,this.allplans[prepopFrom].customs);
	}
	this.add(newPlan,true);
	
	$('#mainDialog').modal('hide');

	this.trigger_change();
	return false;
}


PlanCollection.prototype.add = function(plan,setCurrent) {
	this.allplans.push(plan);	
	this.refreshButtons();
	if (setCurrent) {
		this.currentPlanID = this.allplans.length-1;
		this.goToPlanNum(this.currentPlanID);
	}
		
}

PlanCollection.prototype.trigger_change = function() {
	this.updatePlanSummaries();
	v = this.serialize();
	persisted.setPlans(v);	
}

PlanCollection.prototype.updatePlanSummaries = function() {
	selfref = this;
	$('.planStatusSummary').each(function() {
		planid =$(this).data('myid');
		if ( selfref.get(planid).allAvailable() ) {
			$('.status-available',this).show();
			$('.status-closed',this).hide();
		} else {
			$('.status-available',this).hide();
			$('.status-closed',this).show();
		}
	});
	selfref=null;
}

PlanCollection.prototype.togglePlanDelete = function(confirmed) {
	if ( this.allplans.length > 1 ) {
		$('#deletePlanBtn').removeClass("disabled");
	} else {
		$('#deletePlanBtn').addClass("disabled");
	}
}

PlanCollection.prototype.clear = function(confirmed) {
	if ( confirmed ) {
		
		persisted.setPlans([]);

		location.reload();
	} else {
		launchDialog('dialog-generic',{
				title:"Confirm Clear Plans",
				message:"Are you sure you want to clear your configured plan(s)?",
				buttons: [
					{ "btn-type": "default", "btn-text": "cancel" },
					{ "btn-type": "primary", "btn-text": "Confirm", "btn-action": "plans.clear(true);"}
				  ]
			});		
		
	}
}



	

PlanCollection.prototype.deleteCurrent = function(confirmed) {

	if ( confirmed) {
		this.allplans.splice(this.currentPlanID, 1);
		this.goToPlanNum(0);
		this.refreshButtons();
		this.trigger_change();
		if ( this.allplans.length == 0 ) {
			location.reload();
		}
	} else {
		launchDialog('dialog-generic',{
			title:"Confirm Deletion",
			message:"Are you sure you want to delete the current plan and all courses added to it?",
			buttons: [
				{ "btn-type": "default", "btn-text": "cancel" },
				{ "btn-type": "primary", "btn-text": "Delete", "btn-action": "plans.deleteCurrent(true);"}
			  ]
		});			
	}
	return void(0);
}
 
PlanCollection.prototype.isEmpty = function() {
	for( w=0;w<this.allplans.length;w++) {		
		if ( !this.allplans[w].isEmpty() )
			return false;
	}
	return true;
}


