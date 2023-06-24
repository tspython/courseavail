var courseBuffer = null;

function Plan (planName,id) {
	this.name = planName;
	this.courses = [];
	this.customs = [];
	this.myid = id;
	this.colorIndex = 0;
}
 
Plan.prototype.populate = function(coursesArr,customsArr) {
    this.courses = coursesArr.slice();
	this.customs = customsArr.slice();
};
 
Plan.prototype.getName = function() {
    return this.name;
};
 
 
Plan.prototype.setName = function(to) {
     this.name = to;
	plans.trigger_change();
};


Plan.prototype.serialize = function(json,humanReadable) {
	json = def(json,false);
	humanReadable = def(humanReadable,false);
	if (humanReadable) { 
		str =  this.name+'-';
		if (this.courses.length > 0 ) {
			str += ' courses:'
			for( i=0;i<this.courses.length;i++) {
				str += (i>0?',':'')+this.courses[i].serialize();
			}
		}
		if (this.customs.length > 0 ) { 
			str += ' custom:';
			for( i=0;i<this.customs.length;i++) {		
				str += (i>0?',':'')+this.customs[i].serialize(true);
			}
		}
		return str;
	} else {
		var planObCourses = [];
		var planObCustom = [];
		for( i=0;i<this.courses.length;i++) {		
			planObCourses.push(this.courses[i].serialize());
		}
		for( i=0;i<this.customs.length;i++) {		
			planObCustom.push(this.customs[i].serialize());
		}
		res = {name:this.name,courses:planObCourses,custom:planObCustom};
		if ( json ) 
			return JSON.stringify(res);
		else
			return res;
	}
}


Plan.prototype.buildFromSerialized = function(str,callback) {

	if ( str.courses ) {
		var plob =str;
	} else {		
		try {
			var plob = JSON.parse(str);
		} catch (e) {
			console.log('no valid serialized plan input');
			return false;
		}	
	}

	if ( plob.custom && plob.custom.length > 0 ) {
		for( c=0; c< plob.custom.length; c++) {		
			selfref.customs.push(new CustomBlock(plob.custom[c].title,plob.custom[c].days,plob.custom[c].si,plob.custom[c].ei));//(plob.courses[c],false);
		}
			
	}
	
	var selfref = this;
	if ( plob.courses && plob.courses.length > 0 ) {
	
		ws("details",  plob.courses.join(',') ,function(data) {
			localDB.insertCourses(data.results);
			for( c=0; c< plob.courses.length; c++) {		
				selfref.addCourseBypass(plob.courses[c],false);
			}
			callback();
				
		});
	} else {
		callback();	
	}
	
	return true;

}

Plan.prototype.addCourse = function(cnbr,warned) {
	course = new Course(cnbr);
	if ( this.hasConflict(course) ) {
		course = null;
	} else {
		var warned = typeof warned!== 'undefined' ?  warned : false;
		if (!warned && course.isFull() ) {
			courseBuffer = cnbr;
			launchDialog('dialog-generic',{
				title:"No Seats Remaining",
				message:course.subject +" " + course.catalogNbr + ", section number " + course.sectionUID +" currently shows no seats available. You can ignore this warning and add the course if you've been pre-enrolled in this section or have a permission number. ",
				buttons: [
					{ "btn-type": "default", "btn-text": "cancel" },
					{ "btn-type": "primary", "btn-text": "Ignore and Add", "btn-action": "plans.get("+this.myid+").addCourse(courseBuffer,true);"}
				  ]
			});
		} else {			
			addDebug('add crse'+cnbr + ' to plan' + this.myid);
					
			this.courses.push(course);
			course.buildHTML(this.nextIndex());
			this.addMapPin(course);

			$('#saveBtn').fadeIn('slow');
			this.afterChange();
		}
		doneloading()
	}
	return void(0);
}

Plan.prototype.addMapPin = function(course) { 
	if ( course.lat != null && course.lat != '' ) {
		//get the color from the css class
		/*pincolor = $('.color_'+course.colorID).css('bg');
		if ( typeof(course.letter) !== 'undefined' ) {
			window.schedmap.addPin(course.sectionUID,course.lat,course.long,null,course.letter, null,course.subject+' '+course.catalogNbr+' - ' + course.l_cname);		
		} else {
			window.schedmap.addPin(course.sectionUID,course.lat,course.long,pincolor,null, course.subject+' '+course.catalogNbr+' - ' + course.l_cname);
		}*/
	}
}

Plan.prototype.hasConflict = function(course) { 
	conflictsStr = '';

	//check for duplicate courses (can only add MATH 11 once)
	for( r=0; r<this.courses.length; r++) {		
		if ( course.getString() == this.courses[r].getString() ) {
			error("Cannot add " +course.getString() +". This schedule already includes that course.","Duplicate Course");	
			return true;	
		}
	}
	
	if ( course.meetDays1 == '' ) {
		//there is no schedule informationf for this course, allow add
		return false;	
	}
	
	newCourseCA = course.getConflictArray();
	hasconflictsStr = this.getTimeConflicts(newCourseCA);
	
	if ( hasconflictsStr != '' ) {
		error("Cannot add " +course.getString() +" because it conflicts with the following items in the current schedule: <ul>"+hasconflictsStr+"</ul>","Schedule Conflict");	
		return true;	
	}
	return false;
}

Plan.prototype.getTimeConflicts = function(conflictArray) { 
	res='';
	for( m=0; m<this.courses.length; m++) {		
		thisCourseCA = this.courses[m].getConflictArray();
		if ( casOverlap(conflictArray, thisCourseCA) ) {
			res += '<li>'+this.courses[m].sectionUID + ': ' + this.courses[m].getString() +' meets '+ this.courses[m].mtgsStr;
		}
	}
	for( m=0; m<this.customs.length; m++) {		

		thisCustomCA = this.customs[m].getConflictArray();
		if ( casOverlap(conflictArray, thisCustomCA) ) {
			res += '<li>Custom block: '+this.customs[m].title;
		}
	}
	return res;
}


Plan.prototype.addCourseBypass = function(cnbr,triggerChange) {

	triggerChange = def(triggerChange,true);	

	if ( !this.hasClassNumber(cnbr)  ) {
		course = new Course(cnbr);
		this.courses.push(course);
		this.nextIndex();
		if (triggerChange) {
			this.afterChange();
		}
	}
}

Plan.prototype.afterChange = function() {

	searches.disableConflictsInResults();
	if ( this.name == watchlistPlanName) {
		persisted.setWatchlist(watchlist.serialize(true));	
	}
	plans.trigger_change();
	this.updateCredits();
	this.checkWeekends();
	this.highlight();
}

Plan.prototype.hasClassNumber = function(ag) {
	for( r=0; r<this.courses.length; r++) {		
		if ( this.courses[r].sectionUID == ag ) {
			return true;	
		}
	}
	return false;
}

Plan.prototype.highlight = function() {
	for( r=0; r<this.courses.length; r++) {		
		$('.pi-'+this.courses[r].sectionUID+'-check').fadeOut('fast',function() { $(this).fadeIn() });
		$('#pi-'+this.myid+'-'+this.courses[r].sectionUID+'-add').hide();
		$('#pi-'+this.myid+'-'+this.courses[r].sectionUID+'-in').show();
		elmt = $('.pi-'+this.courses[r].sectionUID+'-check');
		orig = elmt.prop("title"); 
		if ( this.name == watchlistPlanName ) {
			p = 'your watchlist';	
		} else {
			p = 'plan "'+this.name+'"';	
		}
		if ( orig =='' ) {
			elmt.prop("title","Class "+this.courses[r].sectionUID+ " is in "+p);
		} else {
			elmt.prop("title",orig+", "+p);
		}
	}
}
Plan.prototype.buildMap = function(print) {
	/*window.schedmap.clearPins();
	for( k=0;k<this.courses.length;k++) {
		this.addMapPin(this.courses[k]);
	}*/
}

Plan.prototype.buildFloorMap = function(target) {
	for( k=0;k<this.courses.length;k++) {
		htm = '';
		if ( this.courses[k].l_flcid == 0 ) {
			target.append( '<p>Floor map not available for '+ this.courses[k].classTitle);
		} else {
			target.append('<div class="fmapGrid"><h4>'+this.courses[k].classTitle+'</h4><p>'+this.courses[k].mtgsStr+'</p><div id="fmap_'+this.courses[k].sectionUID+'">a</div></div>'); 
			floormap(this.courses[k].l_flcid,$("#fmap_"+this.courses[k].sectionUID));
		}

	}
}

Plan.prototype.assignLetters = function(print) {
	for( k=0;k<this.courses.length;k++) {
		this.courses[k].letter =  String.fromCharCode(65+k);
	}
}

Plan.prototype.display = function() {
	$('.classBlock').fadeOut(250, function() { $(this).remove(); });
	$('.plan-courses').fadeOut(200).html('').fadeIn(100);
	$('#plan-courses-cont').data("planid",this.myid);
	$('.nocourses').show();

	$('#plantitle').html(this.name );
	
	for( k=0;k<this.courses.length;k++) {
		this.courses[k].buildHTML(k+1);
	}
	for( m=0;m<this.customs.length;m++) {
		this.customs[m].buildHTML(m+k+1);
	}
	this.buildMap();
	this.updateCredits();
	this.checkWeekends();
	this.highlight();

	sched_view('week');
}

Plan.prototype.startRename = function() {
	launchDialog('dialog-generic',{
		title:"Rename Plan",
		message:'Enter a new name for this plan (150 characters max).<br><input type="text" class="form-control" name="planrename" id="planrename" value="'+this.name.replace("\"", "\\\"")+'">',
		buttons: [
			{ "btn-type": "default", "btn-text": "cancel" },
			{ "btn-type": "primary", "btn-text": "Rename", "btn-action": "plans.getCurrent().completeRename();"}
		  ]
	});

	return void(0);
}

Plan.prototype.cancelRename = function() {
	$('#plantitle').show();
	$('#planRenameForm').hide();
}

Plan.prototype.completeRename = function() {
	newname = $('#planrename').val();
	if ( newname == '' ) {
		error("Please enter a name for this plan");	
		return;
	} 	
	if ( newname.length > 150 ) {
		error("Plan name must be fewer than 150 characters");	
		return;
	}
	addDebug('plan rename:' + this.myid);
	this.name = newname;
	$('#plantitle').html(newname);
	$('#plantitle').show();
	$('#planRenameForm').hide();
	plans.trigger_change();
	plans.refreshButtons();
	return void(0);
}


Plan.prototype.removeCourse = function(id) {
    found = -1;
	for(var i = 0; i < this.courses.length; i++) {
		if (this.courses[i].sectionUID == id) {
			found = i;
			break;
		}
	}

	if ( found >= 0 ) {
	  this.courses.splice(found, 1);	
	}
	addDebug('rem crse'+id + ', plan' + this.myid);

	$('.plan-featured .plan-item-'+id+', .plan-'+this.myid+'.plan-item-'+id).fadeOut(300,function() { $(this).remove() });
	
	if ( typeof window.schedmap !== 'undefined') {
		window.schedmap.removePin(id);
	}
	this.afterChange();
	return void(0);
}

Plan.prototype.addCustom = function (custom,triggerChange) {
	triggerChange = def(triggerChange,true);	
	addDebug('addCustom to ' + this.myid);
	
	this.customs.push(custom);
	custom.buildHTML(this.nextIndex());
	if (triggerChange) {
		this.afterChange();
	}
	return void(0);
}

Plan.prototype.removeCustom = function(id) {
    found = -1;
	for(var i = 0; i < this.customs.length; i++) {
		if (this.customs[i].uid == id) {
			found = i;
			break;
		}
	}
	if ( found >= 0 ) {
	  this.customs.splice(found, 1);	
	}
	$('.plan-custom-'+id).fadeOut(300,function() { $(this).remove() });
	this.afterChange();
}

Plan.prototype.nextIndex = function () {
	this.colorIndex++;
	return 	this.colorIndex;
}


Plan.prototype.checkWeekends = function() {
	hasSun = false;
	hasSat = false;
	for( r=0; r<this.courses.length; r++) {		
		if (  this.courses[r].mtgsStr.indexOf('Sun') >= 0) {
			hasSun = true;	
		}
		if (  this.courses[r].mtgsStr.indexOf('Sat') >= 0 ) {
			hasSat = true;	
		}
	}
	if (hasSun) {
		$('#day_Sun').removeClass('colHide');
		if (hasSat)
			$('#week-container').removeClass('week-day-5').removeClass('week-day-6').addClass('week-day-7');
		else 
			$('#week-container').removeClass('week-day-5').removeClass('week-day-7').addClass('week-day-6');
	} else {
		$('#day_Sun').addClass('colHide');
	}
	if (hasSat) {
		$('#day_Sat').removeClass('colHide');
		if (!hasSun)
			$('#week-container').removeClass('week-day-5').removeClass('week-day-7').addClass('week-day-6');
	} else {
		$('#day_Sat').addClass('colHide');
	}
	if (!hasSat && !hasSun) {
			$('#week-container').removeClass('week-day-6').removeClass('week-day-7').addClass('week-day-5');
	}
}

Plan.prototype.updateCredits = function() {
	$('#numCredits').html(this.countCredits() + ' units');
}

Plan.prototype.countCredits = function() {
	
	cmin = 0;
	cmax = 0;
	
	for( r=0; r<this.courses.length; r++) {		
		if( isNumber(this.courses[r].minimumUnits) ) {
			cmin += Number(this.courses[r].minimumUnits);
			cmax += Number(this.courses[r].maximumUnits);
		}
	}
	if (cmin == cmax) {
		return cmin;
	}
	return cmin+'-'+cmax;
}

Plan.prototype.isEmpty = function() {
	if (this.courses.length == 0 && this.customs.length == 0 ) {
		return true;	
	}
	return false;
}

Plan.prototype.allAvailable = function() {
	for( r=0; r<this.courses.length; r++) {		
		if ( this.courses[r].seatsRemaining <= 0 ) {
			return false;	
		}
	}
	return true;
}

