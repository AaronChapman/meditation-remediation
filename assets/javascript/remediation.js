/*/ ~ settings array format ~
/•/current_settings = [hours, minutes, beginning_audio, during_audio, ending_audio, theme]
/•/ - hours           ::: [0] 
/•/ - minutes         ::: [1]
/•/ - beginning_audio ::: [2]
/•/ - during_audio    ::: [3] 
/•/ - ending_audio    ::: [4]
/•/ - theme           ::: [5]
/*/

//// TO DO ////
// 1 - complete spacebar functionality
// 2 - add pausing functionality
// 3 - ability to change amount of time to advance by
// 4 - make audio files
// 5 - theme-switching functionality
// 6 - build themes
// 7 - allow advance to zero
// 8 - dim screen checkbox
// 9 - 
// 10 - 
// 11 - 
// 12 - 
// 13 - 
// 14 - 
// 15 -

//globals
var current_user = "";
var current_settings = [];
var theme = "";
var audio = {beginning: "", during: "", ending: "" }
var timer;
var timer_state = "timer_stopped";
var hours = 0, minutes = 0;
var amount_of_time = 3;

//firebase configuration
var config = {
	apiKey: "AIzaSyB4ADQmKLC2-J2sy0825AtBOcDCQoqK8cM",
	authDomain: "meditation-remediation.firebaseapp.com",
	databaseURL: "https://meditation-remediation.firebaseio.com",
	projectId: "meditation-remediation",
	storageBucket: "meditation-remediation.appspot.com",
	messagingSenderId: "1095851183262"
};

firebase.initializeApp(config);

var meditation_remediation_database = firebase.database().ref();

//formats number of seconds to hours:minutes:seconds
String.prototype.hhmmss = function() {
	var sec_num = parseInt(this, 10);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours < 10) { hours   = "0" + hours; }
	if (minutes < 10) { minutes = "0" + minutes; }
	if (seconds < 10) { seconds = "0" + seconds; }

	return hours + ':' + minutes + ':' + seconds;
}

//load user settings
function load_settings() {
	//if user_input field has content
	if ($('.user_input').val().trim()) {
		current_user = $('.user_input').val().trim();
		
		let users_reference = firebase.database().ref('users');
		
		//check firebase for a user matching the input
		users_reference.on("value", function(snapshot) {
			var database_objects = snapshot.val();
			var database_object_array = Object.keys(database_objects).map(function(key) {
				return [database_objects[key]]; 
			});
			
			var found_user = false;
			
			//loop through all users in firebase
			for (var i = 0; i < database_object_array.length; i++) {
				if (database_object_array[i][0].username === current_user) {
					found_user = true;
					
					//update current_settings and settings interface if a matching user was found
					current_settings = database_object_array[i][0].settings;

					update_settings_interface(current_settings, current_user);
				}
				
				//if the requested user could not be found
				if (i === database_object_array.length && !found_user)
					$('.settings_message').text('user does not exist');
			 }
		});
	//if the user did not type anything into the user_input field
	} else {
		$('.settings_message').text('enter a user to load settings for');
	}

	reset_settings_message();
}

//save user settings
function save_settings() {
	//if user_input field has content 
	if ($('.user_input').val().trim()) {
		//set the current_settings
		current_user = $('.user_input').val().trim();
		current_settings = [hours, minutes, audio.beginning, audio.during, audio.ending, theme];
		
		//create a new user object to be stored in firebase
		var user_object = {
			username: current_user,
			settings: current_settings
		};
		
		var new_user_insert = firebase.database().ref().child('users').push(user_object);

		//update user interface
		$('.settings_message').text($('.user_input').val().trim() + '\'s settings were saved');
		$('.current_user').text($('.user_input').val().trim() + "\'s settings");
	//if the user did not type anything into the user_input field	
	} else {
		$('.settings_message').text('enter a user to save settings for');
	}

	reset_settings_message();
}

//update user interface elements related to relevant settings
function update_settings_interface(with_these_settings, for_this_user) {
	hours = with_these_settings[0];
	minutes = with_these_settings[1];
	audio.beginning = with_these_settings[2];
	audio.during = with_these_settings[3];
	audio.ending = with_these_settings[4];
	theme = with_these_settings[5];
	
	$('.settings_message').text(for_this_user + '\'s settings were loaded successfully');
	$('.current_user').text(for_this_user + '\'s settings');
	$('.select_hours').val(with_these_settings[0]);
	$('.select_minutes').val(with_these_settings[1]);
	$(".select_beginning_audio").val(audio.beginning);
	$(".select_during_audio").val(audio.during);
	$(".select_ending_audio").val(audio.ending);
	
	calculate_time();
}

//resets settings message after 3.5 seconds
function reset_settings_message() {
	setTimeout(function() { $('.settings_message').text('load / save settings for:'); }, 3500);
}

//change application theme
function change_theme(theme_option) {
	theme = theme_option;

	//hotswap css file
}

//calculate time Lol
function calculate_time() {
	hours = parseInt($('.select_hours').val(), 10);
	minutes = parseInt($('.select_minutes').val(), 10);
	amount_of_time = (hours * 3600) + (minutes * 60);

	$('.time_left').text(amount_of_time.toString().hhmmss());

	if (amount_of_time >= 300)
		$('.advance_link').css({'color':'lightslategrey'});
}

//set audio options hahah ain't nobody gonna say my naming conventions are flawed
function set_audio_options() {
	audio.beginning = $('.select_beginning_audio').val();
	audio.during = $('.select_during_audio').val();
	audio.ending = $('.select_ending_audio').val();
}

//called when user changes timer state
function set_time() {
	//if timer is running
	if (timer_state === "timer_set") {
		timer_state = "timer_stopped";

		clearInterval(timer);

		amount_of_time = 0;

		$('.time_left').text(amount_of_time.toString().hhmmss());
		$('.advance_link').css({'color':'crimson'});
		$('.start_timer').val('start session');

	//if timer is NOT running
	} else if (timer_state === "timer_stopped") {
		if (amount_of_time > 0) {
			timer_state = "timer_set";
			clearInterval(timer);
			timer = setInterval("update_time()", 1000);

			$('.settings_message').text('load / save settings for:');
			$('.start_timer').val('stop session');
		} else {
			$('.settings_message').text('how long do you want to meditate?');

			reset_settings_message();
		}
	}
}

//update timer
function update_time() {
	amount_of_time--;

	//format string
	$('.time_left').text(amount_of_time.toString().hhmmss());

	//check for 'advance_link' interface changes
	if (amount_of_time < 300) {
		$('.advance_link').css({'color':'crimson'});
	} else {
		$('.advance_link').css({'color':'lightslategrey'});
	}

	//if time is up, reset a bunch of stuff and play audio.ending
	if (amount_of_time === 0) {
		timer_state = "timer_stopped";

		clearInterval(timer);

		$('.start_timer').val('start session');
		$('.select_hours, .select_minutes').empty();

		fill_time_selects();

		$.play_sound(`assets/ending-audio/${audio.ending}.wav`);
	}
}

//populate time-based select elements with appropriate data
function fill_time_selects() {
	for (var i = 0; i < 6; i++) {
		var select_option = i.toString();
		var option_html = '<option value="' + select_option + '">' + select_option + ' hours</option>';

		if (i === 1)
			option_html = '<option value="' + select_option + '">' + select_option + ' hour</option>';

		$('.select_hours').append(option_html);
	}

	for (var i = 0; i < 56; i += 5) {
		var select_option = i.toString();
		var option_html = '<option value="' + select_option + '">' + select_option + ' minutes</option>';

		$('.select_minutes').append(option_html);
	}
}

//populate audio-based select elements with the following array data
function fill_audio_selects() {
	var beginning_audio = ["misty-gongs", "into-the-storm", "wind-chimes"];
	var during_audio = ["jungle-birds", "waterfall", "inside-the-storm", "late-night-in-atlanta"];
	var ending_audio = ["spin-down", "wind-chimes", "out-of-the-storm"];
	
	fill_audio_selects_loop('.select_beginning_audio', beginning_audio);
	fill_audio_selects_loop('.select_during_audio', during_audio);
	fill_audio_selects_loop('.select_ending_audio', ending_audio);
}

//a loop helper for the fill_audio_selects() function
function fill_audio_selects_loop(selector, audio_files) {
	for (var i = 0; i < audio_files.length; i++) {
		var select_option = audio_files[i];
		var option_html = '<option value="'+ select_option + '">' + select_option.replace(/-/g, ' ') + '</option>';

		$(selector).append(option_html);
	}
}

//when ya boy's ready to be listened to
$(document).ready(function() {
	//listen to clicks on the advance_link, which advances your time remaining by 5 minutes
	$('.advance_link').click(function() {
		if (amount_of_time >= 300) {
			amount_of_time -= 300; 

			$('.time_left').text(amount_of_time.toString().hhmmss());
		} else {
			$('.advance_link').css({'color':'crimson'});
			$('.settings_message').text('whoops! can\'t do that right now');

			reset_settings_message();
		}
	}); 
});