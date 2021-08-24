var current_version = '1.0.0';

$('#yhgnPage').animate({
	opacity: 0
}, 100, function(){
	$('#yhgnPage').empty();
	var info_page = '<div id="user_page"></div><div id="scores_page"></div>'
	$('#yhgnPage').html(info_page);
	$('#yhgnPage').animate({
		opacity: 1
	});
});

//获取学号
userKey = $('#sessionUserKey').val();

var scores;
var credit_sum = 0;
var selected_states = new Array();
var selected_color = '#3afbff61';
var hover_color = '#89fff13b';
var is_recommendation = false;

$.ajax({
	type: 'POST',
	url: 'https://jwgl.whu.edu.cn/cjcx/cjcx_cxDgXscj.html?doType=query&gnmkdm=N305005&su='+userKey,
	data: {
		'xnm': '',	
		'xqm': '',	
		'_search': false,
		'nd': '1628856196810',
		'queryModel.showCount':	100,
		'queryModel.currentPage': 1,
		'queryModel.sortName': '',	
		'queryModel.sortOrder':	'asc',
		'time': 1
	},
	success: function(data){
		result = data;
		scores = result["items"];
		handle_datas();
	},
	error: function(){
		alert('请求数据失败...');
	},
	dataType: 'json'
});

function handle_datas(){
	
	build_scores_page();

	build_user_page();
	
	decorate_page();
	
	add_buttons_clicking();
}

function build_user_page(){
	var user_html = '';
	var sum_div = '<div class="user_div"><div class="user_text_item">'+
		'<span class="bold_span">所修总学分: </span>'+credit_sum+'</div>'+create_separator()+
		'<div class="user_text_item">'+
		'<span class="bold_span">共</span> '+scores.length+'<span class="bold_span"> 条记录</span></div></div>';
	
	var button_div = '<div class="user_div" id="user_div_buttons">'+
		create_user_button("全选")+create_user_button("全不选")+
		create_user_button("去除公必")+create_user_button("去除公选")+
		create_user_button("去除专必")+create_user_button("去除专选")+
		create_user_button("去除辅修")+create_user_button("去除重修")+
		'</div>';
	
	var scores_info_div = '<div class="user_div">'+
		'<div class="user_text_item"><span class="bold_span">已选学分: '+'</span>'+'<span id="selected_credits_text"></span>'+'</div>'+create_separator()+
		'<div class="user_text_item"><span class="bold_span">平均分: '+'</span>'+'<span id="average_score_text"></span>'+'</div>'+create_separator()+
		'<div class="user_text_item"><span class="bold_span">平均绩点: '+'</span>'+'<span id="average_gpa_text"></span>'+'</div>'+
		'</div>';
		
	var recommendation_div = '<div class="user_div">'+'<div id="recommendation_div">'+
		create_user_button('计算保研gpa')+'</div>'+create_separator()+
		'<div class="user_text_item"><span class="bold_span">专选课折半算入必修</span></div>'+create_separator()+
		'<div class="user_text_item"><span class="bold_span">GPA: '+'</span>'+
		'<span id="gpa_equation_text">'+'</span>'+'</div>'+
		create_separator()+'<div class="user_text_item"><span class="bold_span">转专业时间: </span>'+create_time_list()+
		'</div>'+
		'</div>';
	
	var help_div = '<div class="user_div">'+
		'<div class="user_text_item"><span id="update_info" class="bold_span">version: </span>'+current_version+
		'</div>'+create_separator()+
		'<div id="update_info_div">'+create_user_button("检查更新")+create_user_button("说明文档")+
		'</div></div>';
		
	user_html += sum_div+button_div+scores_info_div+recommendation_div+help_div;
	$('#user_page').html(user_html);
}

function create_time_list(){
	return '<select id="transfer_time_list">'+
		'<option value="00">----------</option>'+
		'<option value="12">大一下学期</option>'+
		'<option value="21">大二上学期</option>'+
		'<option value="22">大二下学期</option>'+
		'</select>';
}

function change_scores_info(){
	if(is_recommendation){
		calculate_recommendation();
		$('#gpa_equation_text').text(gpa_recommendation.toFixed(4));
	}else{
		var selected_credits = 0;
		var scores_sum = 0;
		var gpa_sum = 0;
		for(var i = 0; i < scores.length; i++){
			if(selected_states[i]){
				selected_credits += parseFloat(scores[i][tds[2]]);
				scores_sum += parseFloat(scores[i][tds[2]])*parseFloat(scores[i][tds[7]]);
				gpa_sum += parseFloat(scores[i][tds[2]])*parseFloat(scores[i][tds[9]]);
			}
		}
		$('#selected_credits_text').text(selected_credits);
		$('#average_score_text').text((scores_sum/selected_credits).toFixed(4));
		$('#average_gpa_text').text((gpa_sum/selected_credits).toFixed(4));
	}
}

function create_separator(){
	return '<div class="separator"></div>';
}

function build_scores_page(){
	tds = ['kcmc', 'kcxzmc', 'xf', 'jsxm', 'kkbmmc', 'xnm', 'xqmmc', 'cj', 'ksxz', 'jd'];
	tds_name = ['课程名', '课程性质', '学分', '教师', '开课学院', '学年', '学期', '成绩', '考试类型', '绩点'];
	var content_html = '';
	//创建表格
	content_html += '<tr>';
	content_html += '<td class="head_item first_column">'+tds_name[0]+'<td />';
	for(var i = 1; i < tds.length; i++){
		content_html += '<td class="head_item">'+tds_name[i]+'<td />';
	}
	content_html += '</tr>';
	
	var current_year = scores[0][tds[5]];
	var current_term = scores[0][tds[6]];
	var credit_of_year = 0;
	var gpa_of_term_required = 0;
	var gpa_of_term_optional = 0;
	var scores_of_term = 0;
	var scores_of_year_required = 0;
	var scores_of_year_optional = 0;
	var credit_of_year_required = 0;
	var credit_of_term_required = 0;
	var credit_of_term_optional = 0;
	var count_of_optional = 0;
	
	space = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
	content_html += '<tr class="sum_of_year">';
	content_html += '<td class="sum_of_year_item" colspan="20">'+'PLACEHOLDER_OF_YEAR'+'<td />';
	content_html += '</tr>';
	content_html += '<tr class="sum_of_term">';
	content_html += '<td class="sum_of_term_item" colspan="20">'+'PLACEHOLDER_OF_TERM'+'<td />';
	content_html += '</tr>';
	for(var i = 0; i < scores.length; i++){
		if(scores[i][tds[5]] === current_year && scores[i][tds[6]] === current_term){
			credit_of_year += parseFloat(scores[i][tds[2]]);
			scores_of_term += parseFloat(scores[i][tds[7]])*parseFloat(scores[i][tds[2]]);

			if(scores[i][tds[1]].indexOf('必修') != -1){
				scores_of_year_required += parseFloat(scores[i][tds[7]])*parseFloat(scores[i][tds[2]]);
				credit_of_year_required += parseFloat(scores[i][tds[2]]);
				credit_of_term_required += parseFloat(scores[i][tds[2]]);
				gpa_of_term_required += parseFloat(scores[i][tds[9]])*parseFloat(scores[i][tds[2]]);
			}else if(scores[i][tds[1]].indexOf('选修') != -1){
				scores_of_year_optional += parseFloat(scores[i][tds[7]])*parseFloat(scores[i][tds[2]]);
				credit_of_term_optional += parseFloat(scores[i][tds[2]]);
				gpa_of_term_optional += parseFloat(scores[i][tds[9]])*parseFloat(scores[i][tds[2]]);
				count_of_optional++;
			}
			
			content_html += '<tr class="data_row">';
			content_html += '<td class="data_item first_column">'+scores[i][tds[0]]+'<td />';
			for(var j = 1; j < tds.length; j++){
				content = scores[i][tds[j]];
				if(j === 3 && content.length > 3){
					content = content.split(";")[0]+'...';
				}
				content_html += '<td class="data_item">'+content+'<td />';
			}
			content_html += '</tr>';
		}else{
			if(scores[i][tds[5]] !== current_year){
				content_html = content_html.replace('PLACEHOLDER_OF_YEAR', 
					create_sum_of_year(current_year, (scores_of_year_required/credit_of_year_required).toFixed(4), 
					scores_of_year_optional, credit_of_year, count_of_optional));

				credit_sum += credit_of_year;

				scores_of_year_required = 0;
				credit_of_year_required = 0;
				scores_of_year_optional = 0;
				credit_of_year = 0;
				count_of_optional = 0;
				
				credit_of_term = credit_of_term_required+credit_of_term_optional;
				content_html = content_html.replace('PLACEHOLDER_OF_TERM', 
					create_sum_of_term(current_year, current_term, (scores_of_term/credit_of_term).toFixed(4),
					(gpa_of_term_required/credit_of_term_required).toFixed(4),
					(gpa_of_term_optional/credit_of_term_optional).toFixed(4),
					credit_of_term));
				scores_of_term = 0;
				gpa_of_term_required = 0;
				credit_of_term_required = 0;
				credit_of_term_optional = 0;
				gpa_of_term_optional = 0;
				
				current_year = scores[i][tds[5]];
				current_term = scores[i][tds[6]];
				content_html += '<tr class="sum_of_year">';
				content_html += '<td class="sum_of_year_item" colspan="20">'+'PLACEHOLDER_OF_YEAR'+'<td />';
				content_html += '</tr>';
				content_html += '<tr class="sum_of_term">';
				content_html += '<td class="sum_of_term_item" colspan="20">'+'PLACEHOLDER_OF_TERM'+'<td />';
				content_html += '</tr>';
				i--;
			}else if(scores[i][tds[6]] !== current_term){
				credit_of_term = credit_of_term_required+credit_of_term_optional;
				content_html = content_html.replace('PLACEHOLDER_OF_TERM', 
					create_sum_of_term(current_year, current_term, (scores_of_term/credit_of_term).toFixed(4),
					(gpa_of_term_required/credit_of_term_required).toFixed(4),
					(gpa_of_term_optional/credit_of_term_optional).toFixed(4),
					credit_of_term));
				scores_of_term = 0;
				gpa_of_term_required = 0;
				credit_of_term_required = 0;
				credit_of_term_optional = 0;
				gpa_of_term_optional = 0;
				
				current_term = scores[i][tds[6]];
				content_html += '<tr class="sum_of_term">';
				content_html += '<td class="sum_of_term_item" colspan="20">'+'PLACEHOLDER_OF_TERM'+'<td />';
				content_html += '</tr>';
				i--;
			}
			
		}
		
	}
	content_html = content_html.replace('PLACEHOLDER_OF_YEAR', 
					create_sum_of_year(current_year, (scores_of_year_required/credit_of_year_required).toFixed(4), 
					scores_of_year_optional, credit_of_year, count_of_optional));
					credit_of_term = credit_of_term_required+credit_of_term_optional;
	content_html = content_html.replace('PLACEHOLDER_OF_TERM', 
					create_sum_of_term(current_year, current_term, (scores_of_term/credit_of_term).toFixed(4),
					(gpa_of_term_required/credit_of_term_required).toFixed(4),
					(gpa_of_term_optional/credit_of_term_optional).toFixed(4),
					credit_of_term));
	credit_sum += credit_of_year;

	$('#scores_page').html(content_html);
}

function create_user_button(content){
	return '<div class="user_button">'+content+'</div>';
}

function select_item(index){
	selected_states[index] = true;
	$('.data_row').eq(index).css('backgroundColor', selected_color);
}
function unselect_item(index){
	selected_states[index] = false;
	$('.data_row').eq(index).css('backgroundColor', 'white');
}

function select_all(){
	for(var i = 0; i < scores.length; i++){
		select_item(i);
	}
	change_scores_info();
}
function select_none(){
	for(var i = 0; i < scores.length; i++){
		unselect_item(i);
	}
	change_scores_info();
}
var kcxz = 'kcxzmc';
function filt_public_required(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][kcxz].indexOf("公共") != -1 && scores[i][kcxz].indexOf("必修") != -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}
function filt_public_optional(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if((scores[i][kcxz].indexOf("公共") != -1 || scores[i][kcxz].indexOf("通识") != -1) 
				&& scores[i][kcxz].indexOf("选修") != -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}
function filt_major_required(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][kcxz].indexOf("专业") != -1 && scores[i][kcxz].indexOf("必修") != -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}
function filt_major_optional(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][kcxz].indexOf("专业") != -1 && scores[i][kcxz].indexOf("选修") != -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}
var major_or_minor = 'kcbj';
function filt_minor(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][major_or_minor].indexOf("主修") == -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}
var normal_or_rebuild = 'ksxz';
function filt_rebuild(){
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][normal_or_rebuild].indexOf("正常考试") == -1){
			unselect_item(i);
		}else{
			select_item(i);
		}
	}
	change_scores_info();
}

var xf = 'xf';
var jd = 'jd';
var gpa_recommendation = 0;
function calculate_recommendation(){
	var gpa_required = 0;
	var gpa_major_optional = 0;
	var credits_required = 0;
	var credits_major_optional = 0;
	for(var i = 0; i < scores.length; i++){
		if(!selected_states[i]){
			continue;
		}
		if(scores[i][kcxz].indexOf('必修') != -1){
			credits_required += parseFloat(scores[i][xf]);
			gpa_required += parseFloat(scores[i][xf])*parseFloat(scores[i][jd]);
		}else if(scores[i][kcxz].indexOf('专业') != -1 && scores[i][kcxz].indexOf('选修') != -1){
			credits_major_optional += parseFloat(scores[i][xf])/2;
			gpa_major_optional += parseFloat(scores[i][xf])*parseFloat(scores[i][jd])/2;
		}
	}
	gpa_recommendation = (gpa_required+gpa_major_optional)/(credits_required+credits_major_optional);
}

function reset_recommendation_button(){
	is_recommendation = false;
	
	$('.user_button').eq(8).css('backgroundColor', 'white');
	$('.user_button').eq(8).bind('mouseenter', function(){
		$(this).css('backgroundColor', hover_color);
		// alert($('.user_button').index(this));
	}).bind('mouseleave', function(){
		$(this).css('backgroundColor', 'white');
	});
}

var course_setter = 'kkbmmc'; 
var course_year = 'xnm';
var course_term = 'xqmmc';
function select_recommendation_rows(){
	is_recommendation = true;
	$('.user_button').eq(8).css('backgroundColor', selected_color);
	$('.user_button').eq(8).unbind('mouseenter').unbind('mouseleave');
	
	var transfer_time = $('#transfer_time_list').val();"00,12,21,22"
	
	var judge_recommendation;
	var judge_transfer;
	var start_year = parseInt(scores[0][course_year]);
	for(var i = 0; i < scores.length; i++){
		judge_transfer = true;
		if(transfer_time === '12'){
			if(parseInt(scores[i][course_year]) == start_year && parseInt(scores[i][course_term]) < 2 && 
				scores[i][kcxz].indexOf("专业") != -1){
				judge_transfer = false;
			}
		}else if(transfer_time === '21'){
			if(parseInt(scores[i][course_year]) == start_year && scores[i][kcxz].indexOf("专业") != -1){
				judge_transfer = false;
			}
		}else if(transfer_time === '22'){
			if(parseInt(scores[i][course_year]) == start_year && scores[i][kcxz].indexOf("专业") != -1){
				judge_transfer = false;
			}else if(parseInt(scores[i][course_year]) == start_year+1 && parseInt(scores[i][course_term]) < 2 && 
				scores[i][kcxz].indexOf("专业") != -1){
				judge_transfer = false;
			}
		}
		
		judge_recommendation = ((scores[i][kcxz].indexOf('必修') != -1) || 
				(scores[i][kcxz].indexOf('专业') != -1 && scores[i][kcxz].indexOf('选修') != -1)) && 
				(scores[i][course_setter].indexOf('体育') == -1);
		if(judge_recommendation && judge_transfer){
			select_item(i);
		}else{
			unselect_item(i);
		}
	}
	
	change_scores_info();
}

function add_buttons_clicking(){
	select_all();
	
	var buttons = $('.user_button');
	$('.user_button').bind('mouseenter', function(){
		$(this).css('backgroundColor', hover_color);
		// alert($('.user_button').index(this));
	}).bind('mouseleave', function(){
		$(this).css('backgroundColor', 'white');
	});
	
	$('.user_button').eq(0).click(function(){
		reset_recommendation_button();
		select_all();
	});
	$('.user_button').eq(1).click(function(){
		reset_recommendation_button();
		select_none();
	});
	$('.user_button').eq(2).click(function(){
		reset_recommendation_button();
		filt_public_required();
	});
	$('.user_button').eq(3).click(function(){
		reset_recommendation_button();
		filt_public_optional();
	});
	$('.user_button').eq(4).click(function(){
		reset_recommendation_button();
		filt_major_required();
	});
	$('.user_button').eq(5).click(function(){
		reset_recommendation_button();
		filt_major_optional();
	});
	$('.user_button').eq(6).click(function(){
		reset_recommendation_button();
		filt_minor();
	});
	$('.user_button').eq(7).click(function(){
		reset_recommendation_button();
		filt_rebuild();
	});
	
	$('.user_button').eq(8).click(function(){
		if(!is_recommendation){
			select_recommendation_rows();
		}else{
			reset_recommendation_button();
			change_scores_info();
		}
	});
	
	$('.user_button').eq(9).click(function(){
		
	});
	$('.user_button').eq(10).click(function(){
		help_text = "新教务系统暂时查询不到未出分课程\n谢谢使用！";
		alert(help_text);
	});
	
	var data_rows = $('.data_row');
	$('.data_row').hover(function(){
		var index = data_rows.index(this);
		if(!selected_states[index]){
			$(this).css('backgroundColor', hover_color);
		}
	}, function(){
		var index = data_rows.index(this);
		if(!selected_states[index]){
			$(this).css('backgroundColor', 'white');
		}
	});
	$('.data_row').click(function(){
		var index = data_rows.index(this);
		selected_states[index] = !selected_states[index];
		var color = selected_states[index] ? selected_color : 'white';
		$(this).css('backgroundColor', color);
		
		change_scores_info();
	});
}

function create_sum_of_year(current_year, average_scores_required, sum_scores_optional, 
	credit_of_year, count){
	return '<span class="bold_span">'+
		current_year+'年</span> 全部学期'+space+'<span class="bold_span">必修课平均分: </span>'+average_scores_required
		+space+'<span class="bold_span">选修课总分: </span>'+sum_scores_optional+'(共'+count+'门)'+space
		+'<span class="bold_span">所修学分: </span> '+credit_of_year;
}

function create_sum_of_term(current_year, current_term, average_scores, 
	average_gpa_of_term_required, average_gpa_of_term_optional, credit_of_term){
		return '<span class="bold_span">'+
		current_year+'年</span> 第'+current_term+'学期'+space+'<span class="bold_span">平均分: </span>'+
		average_scores+space+
		'<span class="bold_span">必修GPA: </span>'+average_gpa_of_term_required+space+
		'<span class="bold_span">选修GPA: </span>'+average_gpa_of_term_optional+space+
		'<span class="bold_span">所修学分: </span>'+credit_of_term;
	}

function decorate_page(){
	$('#alertmod_tabGrid').css('display', 'none');
	//修饰成绩单
	$('.data_item').css('textAlign', 'center');
	$('.data_item').css('padding', '2px 10px');
	$('.data_item').css('borderRight', '1px solid #0483d4');
	$('.data_item').css('borderBottom', '1px solid #0483d4');
	$('.first_column').css('borderLeft', '1px solid #0483d4');
	$('.head_item').css('borderTop', '1px solid #0483d4');
	$('.head_item').css('fontWeight', 'bold');
	$('.head_item').css('textAlign', 'center');
	$('.head_item').css('padding', '2px 10px');
	$('.head_item').css('borderRight', '1px solid #0483d4');
	$('.head_item').css('borderBottom', '1px solid #0483d4');
	
	$('.head_item').eq(0).css('borderRadius', '10px 0px 0px 0px');
	$('.head_item').eq(tds.length-1).css('borderRadius', '0px 10px 0px 0px');
	$('.data_item').eq(scores.length*tds.length-1).css('borderRadius', '0px 0px 10px 0px');
	$('.data_item').eq((scores.length-1)*tds.length).css('borderRadius', '0px 0px 0px 10px');
	
	$('.head_item').css('background', '#4397e026');
	$('#scores_page').css('marginLeft', '200px');
	$('.bold_span').css('fontWeight', 'bold');
	$('.sum_of_year_item').css('textAlign', 'center');
	$('.sum_of_year_item').css('borderRight', '1px solid #0483d4');
	$('.sum_of_year_item').css('borderLeft', '1px solid #0483d4');
	$('.sum_of_year_item').css('borderBottom', '1px solid #0483d4');
	$('.sum_of_year_item').css('padding', '2px');
	$('.sum_of_term_item').css('textAlign', 'center');
	$('.sum_of_term_item').css('borderRight', '1px solid #0483d4');
	$('.sum_of_term_item').css('borderLeft', '1px solid #0483d4');
	$('.sum_of_term_item').css('borderBottom', '1px solid #0483d4');
	$('.sum_of_term_item').css('padding', '2px');
	
	$('#user_page').css('display', 'inline');
	$('#user_page').css('float', 'left');
	$('#user_page').css('width', '190px');
	$('#user_page').css('position', 'fixed');
	
	$('.user_button').css('width', '90px');
	$('.user_button').css('height', '30px');
	$('.user_button').css('borderRadius', '5px');
	$('.user_button').css('border', '1px solid #1f04d4');
	$('.user_button').css('textAlign', 'center');
	$('.user_button').css('display', 'inline');
	$('.user_button').css('float', 'left');
	$('.user_button').css('padding', '5px 0px');
	$('.user_button').css('margin', '2px');

	
	$('.user_text_item').css('textAlign', 'center');
	$('.user_text_item').css('width', '190px');
	$('.user_text_item').css('padding', '2px 0px');
	
	$('.user_div').css('border', '1px solid #0483d4');
	$('.user_div').css('borderRadius', '5px');
	$('.user_div').css('marginBottom', '5px');
	$('#user_div_buttons').css('height', '140px');
	
	$('.separator').css('borderBottom', '1px solid #0483d4');
	$('.separator').css('height', '1px');
	
	$('#recommendation_div').css('paddingLeft', '50px');
	$('#recommendation_div').css('height', '35px');
	
	$('#update_info_div').css('height', '35px');
}