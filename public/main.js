
function swapTheme(b) {
            $('#theme').attr("href", `themes/theme${b}.css`)
            switch (b) {
                case 1:
                    type="Purple"; break
                case 2:
                    type="Green"; break
                case 3:
                    type="Black"; break
                case 4:
                    type="Blue"; break
                case 5: 
                    type="Coffe"; break
                case 6:
                    type="Undecorated"; break
            }
            localStorage.setItem('theme', b+type)
            $('#swap-theme').html(`Swap Theme (Current: ${type}`)
}

//TODO: SAVE THEME PREFERENCE
$(document).ready(function () {
    type=localStorage.getItem('theme')
    a=localStorage.getItem('theme')
    if(a != null && a != undefined && a != NaN) {
         swapTheme(a[0])
    }
    else {
        localStorage.setItem('theme', 0)
    }
    b=0

    if ($.cookie('sessionkey') == undefined) {
       if(window.location.href == 'https://monthly-devoted-pug.ngrok-free.app/webchat.html') {
          window.location.replace('https://monthly-devoted-pug.ngrok-free.app/index.html')
       }
     
        $('#register').css('visibility', 'visible')
        $('#loginScreen').css('visibility', 'visible')
    }
    else {
     
        connectToServer('loadProfile', $.cookie('sessionkey'), '', '', '', '')
    }
    $('input').on('mouseup', function (evt) {
        evt.preventDefault()


        switch (this.id) {
            case 'send-globalmsg':

                text = $('#global-textarea').val()
                doSend('&nbsp;' + ` [${username}] ` + ' --> ' + text, 'globalmsg', 'all')
                $('#global-textarea').val('')

                $('#globalChat').scrollTop(999999999999);

            break
            
            case 'setUser':
                if ($.cookie('sessionkey') == undefined) {
                    password = $('#password').val()
                    user = $('#username').val()

                    if (password == '' || user == '') {
                        alert('Name or password cant be empty!')
                        break
                    }
                
                    connectToServer('newUser', user, password)
                }
                else {
                    $('#register').css('visibility', 'hidden')
                    $('#loginScreen').css('visibility', 'hidden')
                }
                break

            case 'login':
                password = $('#password').val()
                user = $('#username').val()

                if (password == '' || user == '') {
                    alert('Name or password cant be empty!')
                    break
                }
                connectToServer('checkLoginCredentials', user, password)
                break

            case 'edit-profiledesc':
                $('#profile-description').removeAttr('readonly');
                $('#profile-age').removeAttr('readonly');
                $('#profile').addClass('edit-mode');
                break

            case 'save-profile':
                description = $('#profile-description').val()
                age = $('#profile-age').val()
                $('#profile-description').attr('readonly', 'true');
                $('#profile-age').attr('readonly', 'true');
                $('#profile').removeClass('edit-mode');
                connectToServer('updateProfile', $.cookie('sessionkey'), '', age, description)
                break

            case 'send-friendreq':
                userToRequest = $('#stranger-profilename').text()            

                connectToServer('sendFriendRequest', username, '', '', '', userToRequest)
                break

            case 'notif-option1':
                //decline request
            case 'notif-option2':

                option = $(this).val()
                
                if (option == 'Accept Request') {
                    newFriend = $('.selected').children().text()
                    alert(newFriend) 
                    connectToServer('addFriend', username, '', '', '', newFriend)
                }
                else if (option == 'Decline Request') {
                    $('.selected').remove()

                }
                break         

            case 'friend-sendDM':

                $('#profiles-section').css({display: 'none'})
                $('#privatechat-section').css({display: 'block'})
                $('#friendlist-section').css({display: 'none'})

                selectedFriend = $('.selected .friend-name').text()

                privMsgsList = getDMs(selectedFriend.trim())

                $('#privateChat').html('')

                if(privMsgsList != 'none') {
                    $.each(privMsgsList, function (index, element) { 
                        $('#privateChat').append(`<p id="chat-user"> ${element} </p>`)
                    });
                } 
                $('#privatechat-title').html(`Your private chat with <b>${selectedFriend}</b>`);
            break

            case 'send-privatemsg':
                text = $('#private-textarea').val()
                $('#privateChat').append('<p id="chat-user"> &nbsp;' + ` [${username}]  -->  ${text} </p>`)
                
                DM = '&nbsp;' + ` [${username}] ` + ' --> '
                addDMs(selectedFriend, DM)
                doSend(DM + text, 'privatemsg', selectedFriend)
                $('#private-textarea').val('')
           
            break

        }
    });


    $(document).on('mouseup', 'p', function (evt) {
        evt.stopPropagation()
        stranger = $(this).text().match(/\[([^\]]+)\]/)
        if (stranger[1] != username) {
            $('#profiles-section').css({display: 'block'})
            $('#friendlist-section').css({display: 'none'})
            $('#privatechat-section').css({display: 'none'})
            connectToServer('loadStrangerProfile', stranger[1], '', '', '')
        }

        if (friends.includes(stranger[1])) {
            $('#send-friendreq').attr('disabled', true);
        } else {
            $('#send-friendreq').attr('disabled', false);
        }
    })

    $(document).on('mouseup', 'li', function (evt) {
        evt.stopPropagation()

        switch (this.id) {

            case 'showprofiles-option':
                $('#privatechat-section').css({display: 'none'})
                $('#friendlist-section').css({display: 'none'})
                $('#profiles-section').css({display: 'block'})
            break

            case 'showfriends-option':
                 $('#profiles-section').css({display: 'none'})
                 $('#privatechat-section').css({display: 'none'})
                 $('#friendlist-section').css({display: 'block'})
            break

            case 'show-privatechat':
                $('#profiles-section').css({display: 'none'})
                $('#friendlist-section').css({display: 'none'})
                $('#privatechat-section').css({display: 'block'})

            break
 
            case 'friendreq-tab':
                $('#notifications-messages').css('visibility', 'hidden')
                $('#notifications-global').css('visibility', 'hidden')
                $('#notifications-friendreq').css('visibility', 'visible')

                $('#notif-option1').val('Accept Request');
                $('#notif-option2').val('Decline Request');
                break
            case 'messages-tab':
                $('#notifications-messages').css('visibility', 'visible')
                $('#notifications-global').css('visibility', 'hidden')
                $('#notifications-friendreq').css('visibility', 'hidden')
                
                $('#notif-option1').val('Delete Message');
                $('#notif-option2').val('Open Message');
                break
            case 'global-tab':
                $('#notifications-messages').css('visibility', 'hidden')
                $('#notifications-global').css('visibility', 'visible')
                $('#notifications-friendreq').css('visibility', 'hidden')

                $('#notif-option1').val('Delete Message');
                $('#notif-option2').val('Forward to Global (future feature not doing this soon)');
                break 
                
            
            case 'swap-theme':
                     b+=1
                     if(b>6) b=1
                     swapTheme(b)
                break
    }

    parent = $(this).parent()
    validParents = ['notifications-friendreq', 'notifications-messages', 'notifications-global', 'friend-list']
    if (validParents.includes(parent[0].id) ) {

        $.each(validParents, function (index, element) { 
            $('#'+element).children().removeClass('selected')
        });

        $(this).addClass('selected');    
     } })
});

function connectToServer(action, name, password, age, description, friend, preferences) {
    fetch('https://monthly-devoted-pug.ngrok-free.app/databaseupdates', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: action,
            name: name,
            password: password,
            age: age,
            description: description,
            friend: friend,
            preferences: preferences
        })
    })
        .then(response => response.json())
        .then(data => {

            switch (action) {
                case 'newUser':

                    if (data.error != undefined && data.error == 'DUPLICATEDUSER') {
                        alert('ERROR: User already exists')
                        break
                    }

                    $.cookie('sessionkey', data.sessionKey)
                    alert(`User: "${name}" created successfully!`)
                    window.location.replace('https://monthly-devoted-pug.ngrok-free.app/webchat.html')

                case 'checkLoginCredentials':

                    if (data.message == 'LOGIN SUCCESSFUL!') {
                        window.location.replace('https://monthly-devoted-pug.ngrok-free.app/webchat.html')
                        $('#register').css('visibility', 'hidden')
                        $('#loginScreen').css('visibility', 'hidden')
                        $.cookie('sessionkey', data.sessionKey[0][0].sessionkey)
                        $('#profile-name').html(name)
                        connectToServer('loadProfile', $.cookie('sessionkey'), '', '', '', '')
                    }
                    alert(data.message)
                    break

                case 'updateProfile':
                    $('#profile-description').val(description);
                    $('#profile-age').val(age);
                    alert(data.message)
                    break

                case 'loadProfile':
                    $('#profile-name').html(data.userData[0][0].username);
                    $('#profile-age').val(data.userData[0][0].age);
                    $('#profile-description').val(data.userData[0][0].description);
                    username = data.userData[0][0].username

                    connectToServer('loadAllNotifications', username)
                    connectToServer('loadFriendList', username)
                  

                    $.each(data.globalHistory, function (index, globalmsg) { 
                        $('#globalChat').append( `<p id=chat-user> ${globalmsg} </p>`)

                    });
 
                    break

                case 'loadStrangerProfile':
                    $('#stranger-profileage').html(data.strangerData[0][0].age);
                    $('#stranger-profiledesc').val(data.strangerData[0][0].description);
                    $('#stranger-profilename').html(data.strangerData[0][0].username);
                    break

                case 'sendFriendRequest':
                    
                    alert(data.message)
                    break

                case 'addFriend':

                    alert('New friend added successfully!')
                   // console.log(data.added)
                    connectToServer('loadFriendList', username)
                    //window.location.reload()
                    break

                case 'loadFriendList':
                    $('#friend-list').html('')
                    friends = data.friendlist;
                    $.each(friends, function (index, element) { 
                       
                        $('#friend-list').append(`<li> <b class="friend-name"> ${element} </b> - Status: Offline </li>`)    
                          
                    });
                   
                    break

                case 'loadAllNotifications':
                    
                    data.friendReqNotifications.forEach(reqnotif => {           
                        $('#notifications-friendreq').append(reqnotif.content)
                    });
                    break

                case 'removeNotifications':

                    //asjghdslkghskgldshgjsgls
                break
            }
        })
        .catch(error => {
            console.error('Error in database operation:', error);

        });
}
