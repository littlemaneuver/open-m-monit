#Open-m-monit on Nodejs


###Clone this repo and do the follow:
1. Create the file config.json and add your monit servers:

```javascript
{"clusterName":
        [
            {
            "hostname": "serverHostname or ip and port",
            "username": "baseAuth username",
            "password": "your baseAuth passwrrd",
            "alias"   : "aliasName(optional)"
            },
            ....
        ],
        ....
    }
```
2. Configure your port. U can use **tcp** or **unix** socket. Change *port.json*:

```javascript
{
    "type": "tcp",
    "port": 3000
}
```
or:

```javascript
{
    "type": "unix",
    "socket": "path_to_file"
}
```
3. Get inside the containing directory (if you haven't already) and type `node app` 
Your open-m-monit is at `your.hostname:port`.

All information about m-monit is available [here](http://mmonit.com/).
