function restore(rid) {
	ws('user_storage/restore',rid,function (data) {
		launchDialog('dialog-generic',{
			title:"Restore Schedule",
			message:data.results
		});
		if  ( data.title == 'ok' ) {
			plansOb = json_parse(data.reflect);
			plans.buildFromSerialized(plansOb.plans);
			history_init();
		}
	});
	return void(0);	
}

function history_init() {
	$('#historytable').html('');
	ws('user_storage/history',null,function (data) {
		allUids=[];
		for ( i=0; i< data.results.length; i ++ ) {
			packStr = data.results[i].package;
			unpacked = json_parse(packStr);
			
			uid = hash(JSON.stringify(unpacked.plans)+JSON.stringify(unpacked.watchlist));
			
			if ( allUids.indexOf(uid) == -1 ) {
				allUids.push(uid);	
				summary = render('templ-history',unpacked);
				if ( i == 0 ) 
					var btn = '<em>current</em>';
				else 
					var btn = '<a href="javascript:restore('+data.results[i].rid+');" class="btn btn-sm btn-warning">restore <i class="fa fa-archive"></i></a>';
				$('#historytable').append(
					'<tr><td>'+data.results[i].last_upd + '<td>'+data.results[i].term + '<td>'  +summary+'<td>'+btn			
				);	
			}
		}
		if (data.results.length == 0 ) {
			$('#historytable').append('<tr><td colspan=4>No results. <a href="javascript:goToPage(\'schedule\',true)">Click here</a> to  start creating your schedule!' );	
		}
		
	});
}
