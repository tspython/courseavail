function CourseDB () {
	this.db = {};
}

CourseDB.prototype.ct = function(  ) {
	var count = 0;
	for (k in this.db) if (this.db.hasOwnProperty(k)) count++;
	return count;
}

CourseDB.prototype.insertCourses = function( dataOb,expandIndex ) {
	expandIndex = def(expandIndex,false);
	if ( typeof this.index == 'undefined' && dataOb.length > 0) {
		this.index =[];
		for (var property in dataOb[0]) {
			if (dataOb[0].hasOwnProperty(property) ) {
				this.index.push(property);
			}
		}
	}
	
	if (expandIndex) {
		for (var property in dataOb[0]) {
			if (dataOb[0].hasOwnProperty(property) && this.index.indexOf(property) == -1 ) {
				this.index.push(property);
			}
		}
	}
		
		
	for(var i=0;i<dataOb.length;i++) {		
		nm = 'cr'+dataOb[i].sectionUID;
 		if ( ! this.db.hasOwnProperty(nm) ) {
			thisCourse = [];
			for(var k=0;k<this.index.length;k++) {		
				thisCourse.push(dataOb[i][this.index[k]]);
			}
			this.db[nm] = thisCourse;
		}
	}

}

/* Get a course out of the database. If the "allDetails" param is true, we'll require that all details of the course be present (and look it up if not)*/
CourseDB.prototype.select = function( id, useterm, allDetails ) {
	useterm = def(useterm,term);
	allDetails = def(allDetails,false);
	selfref = this;
	nm = 'cr'+id;
	if ( ! this.db.hasOwnProperty(nm) || (allDetails && this.db[nm].termName != '')  ) {
		delete this.db[nm];
		ws('details',id,function(data) {
			if ( data.results.length == 0 ) {			
				//alert('Error: ' + id + ' was not found');
			} else {

				selfref.insertCourses(data.results,true);
			}
		},'get',window.term,window.career,false);

	}
	return this.db[nm];	
}
