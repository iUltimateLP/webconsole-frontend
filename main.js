// Globals
var ws;
var url;
var isAuthenticated = false;

// Helper function to make a two digit number
function td(n)
{
    return n < 10 ? '0' + n : n;
}

// Creates a log entry on the web page
function createLog(verbosity, timestamp, category, msg)
{
    if (msg != "")
    {
        var list = document.getElementById("log-list");

        var timestampHtml = "<div class=\"log-badge\">" + timestamp + "</div>";
        var categoryHtml = "<div class=\"log-badge log-category\">" + category + "</div>";
        var messageHtml = "<code>" + msg + "</code>";
        var html = "<li class=\"log log-" + verbosity + "\">";
        
        if (timestamp != "")
            html += timestampHtml;

        if (category != "")
            html += categoryHtml;

        html += messageHtml + "</li>";

        list.innerHTML += html;

        if (document.getElementById("autoScrollCheck").checked)
        {
            list.scrollTo(0, list.scrollHeight);
        }
    }  
}

// WebSocket callbacks
function onWebSocketClose()
{
    console.log("WebSocket connection closed");

    if (isAuthenticated)
    {
        var date = new Date();
        var timestamp = td(date.getUTCFullYear()) + "." + td(date.getUTCMonth() + 1) + "." + td(date.getUTCDate()) + "-" + td(date.getUTCHours()) + "." + td(date.getUTCMinutes()) + "." + td(date.getUTCSeconds());
        createLog("system", timestamp, "System", "WebSocket connection closed.");
        
        document.getElementById("connection-label").innerHTML = "Not " + document.getElementById("connection-label").innerHTML + " (please disconnect)";
        document.getElementById("connection-label").setAttribute("style", "color: #EC5F67 !important");
    }
}

function onWebSocketError(e)
{
    console.error("WebSocket error: " + e);

    document.getElementById("webSocketError").style.display = "block";
}

function onWebSocketMessage(e)
{
    if (isAuthenticated)
    {
        try {
            var obj = JSON.parse(e.data);

            if (obj.timestamp != undefined && obj.verbosity != undefined && obj.category != undefined && obj.message != undefined)
            {
                var verbosity = obj.verbosity;

                if (obj.category == "Cmd")
                    verbosity = "good";

                createLog(verbosity, obj.timestamp, obj.category, obj.message);
            }
            else
            {
                console.error("Received malformed WebSocket message: " + e.data);
            }
        }
        catch (exception) {
            console.error("Received malformed WebSocket message: " + e.data);
        }
    }
    else
    {
        var obj = JSON.parse(e.data);

        if (obj.cmd == "AUTHENTICATION_DONE")
        {
            document.getElementById("connect-form").remove();

            var hintHTML = "<small id=\"connection-label\" class=\"form-text text-muted\" style=\"margin-right: 10px\">Connected to " + url + "</small><button class=\"btn btn-secondary my-2 my-sm-0 button-snap-right\" type=\"submit\" onclick=\"disconnect()\">Disconnect</button>";
            document.getElementById("navbar").innerHTML += hintHTML;
        
            document.getElementById("log-container").style.display = "block";

            isAuthenticated = true;

            // Request all logs
            var command = {"cmd": "REQUEST_ALL_LOGS"};
            ws.send(JSON.stringify(command));
        }
        else if (obj.cmd == "AUTHENTICATION_ERROR")
        {
            isAuthenticated = false;

            console.error("Authentication error");

            document.getElementById("passwordIncorrectError").style.display = "block";

            ws.close();
        }
    }
}

function onWebSocketOpen()
{
    console.log("WebSocket connection opened!");

    // Auth
    var command = {"cmd": "AUTHENTICATE", "password": document.getElementById("passwordInput").value};
    ws.send(JSON.stringify(command));
}

// Called by the "Connect" button
function connect()
{
    url = document.getElementById("ipAddressInput").value;

    if (url != "")
    {
        if (!url.startsWith("ws://") && !url.startsWith("wss://"))
        {
            url = "ws://" + url;
        }

        console.log("Connecting to " + url);

        ws = new WebSocket(url);
        ws.onclose = onWebSocketClose;
        ws.onerror = onWebSocketError;
        ws.onmessage = onWebSocketMessage;
        ws.onopen = onWebSocketOpen;
    }
}

function disconnect()
{
    ws.close();
    setTimeout(function() {
        window.location.reload();
    }, 200);
}

function clearOutputLog()
{
    document.getElementById("log-list").innerHTML = "";
}

function onAutoScrollCheck()
{
    var isChecked = document.getElementById("autoScrollCheck").checked;

    if (isChecked)
    {
        var list = document.getElementById("log-list");

        list.scrollTo(0, list.scrollHeight);
    }
}
