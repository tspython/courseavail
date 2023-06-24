
/**********************************************/
function export_init() {	
	
	$('#termff').val(term);	
	$('#careerff').val(career);	
	
		
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
	
	


}
