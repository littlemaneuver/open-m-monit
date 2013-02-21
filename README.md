#Open-m-monit on Nodejs


###Clone this repo and do the follow:
1. Add your monit-servers to config.json **(you should create it)** file like:
```{"clusterName":
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
}```
2. Change directory to containing directory
3. Type `node app`
Your open-m-monit is on `your.hostname:port`

All information about m-monit you can read [here](http://mmonit.com/).
    