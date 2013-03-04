#Open-m-monit on Nodejs


###Clone this repo and do the follow:
1. Add your monit-servers to config.json **(you should create it)** file like:

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
2. Configure your port. U can use **tcp** or **unix** socket. For configuring you should change *port.json* file such as:

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
3. Change directory to containing directory
4. Type `node app`
Your open-m-monit is on `your.hostname:port`

All information about m-monit you can read [here](http://mmonit.com/).
    