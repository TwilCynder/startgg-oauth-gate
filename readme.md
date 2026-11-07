# Start.GG Oauth Gate (SGGOG)

Shares start.gg API tokens obtained via Oauth with apps that can't use it.

SGGOG implements the start.gg OAuth process in a local server, serving a web page allowing the user to log into their account, and (unlike normal OAuth applications) saves the obtained API token as a global state (no cookies involved) and exposes it through HTTP.
This means that programs that cannot use OAuth (i.e. non-web apps like CLI apps) can authenticate with the API with an OAuth-obtained token, as long as anyone logged into their start.gg account through SGGOG (which means the aforementioned program will be authenticated as that user !)

Note that running the OAuth process requires a registered start.gg OAuth app, which can be created in your developper settings on start.gg.  
The callback URI needs to use the exact one that your local SGGOG instance will be accessed at (e.g. `127.0.0.1:54301/callback` if you use the default port + want to access it from the local machine)

(if you're lost and haven't learned in-depth about OAuth yet, I recommend getting a good understanding of it first because SGGOG uses it in an unusual way)

**/!\ Note that this system should be considred "unsafe" : once you log in, a token allowing any program to act on your behalf will be exposed. Use this only if you understand what it means, and can ensure no malicious external actor will be able to query SGGOG's HTTP server**

## Install, setup and use
- **Install** : Clone or download this repo, then run `npm install` in it.
- **Setup** : On your developper settings in start.gg, create an OAuth app. Use `127.0.0.1:54301/callback` for the "Redirect URI" field (replace the port with the one you want the web server, and your machine's local IP if you want to access SGGOG from other machines on the local network (NOT RECOMMENDED))
- **Run** : `./launch.sh`. 
  - You need to provide the following environment variables (`launch.sh` will automatically look for a [`./.env` file](https://nodejs.org/api/environment_variables.html#env-files))
    - `SGG_OAUTH_CLIENT_ID` : client ID of your OAuth app, as provided by its page in your start.gg dev settings
    - `SGG_OAUTH_REDIRECT_URI` : redirect URI that you specified on the same page
    - `SGG_OAUTH_CLIENT_SECRET` : client secret found on the same page   
  - If you are not using the default port or IP/host (127.0.0.1:54301), they must be provided through the `PORT` and `HOST` environment variables, or the `-p/--port` and `-H/--host`. *They need to be the same as the ones you used in the OAuth App's Redirect URI*.
  - Use the `-s` CLI flag to persist the token, so you don't have do login again if SGGOG is closed. 
- **Use** : Open `http://127.0.0.1:54301` in a web browser and click the Login button ; complete start.gg's Login + Authorization flow.  
Once this is done, requests to `http://127.0.0.1:54301/token` will return an API token, usable by any external program.

## More details
One thing to keep in mind when registering the OAuth App and its Redirect URI is that because of how OAuth works, SGGOG will only work if queried using the exact hostname you registered, so if you run it on a machine that has the local IP `192.168.1.12`, register that IP in you OAuth app, and try to access it from the same machine as `127.0.0.1` or `localhost`, *it will not work* despite your HTTP queries correctly reaching the server - conversely, if you register `127.0.0.1`, you won't be able to access SGGOG from any other machine. For this reason, it is pointless to use `0.0.0.0` as the host to listen to all IPs. Also, you cannot use `localhost` instead of 127.0.0.1.  
This all might sound pretty impractical, but OAuth was never made for services running on a local server, so that's the best we can do. 
In any case, keep in mind that : 
- The web server will listen to the port and IP you specify with the `PORT` and `HOST` environment variables, or the `-p/--port` and `-H/--host`
- They must be the same as in the Redirect URI

SGGOG can then be ran either via `node main.js` or `./launch.sh` (both from the directory's root), the only difference being that `./launch.sh` [loads environment variables from `./.env`](https://nodejs.org/api/environment_variables.html#env-files) if it exists.  
The available CLI options can be listed using the `-h` flag.

Once SGGOG is running, a user needs to open the web page served at `/` (by accessing `http://<ip>:<port>` directly in a web browser), click "Authenticate", follow start.gg's OAuth steps (log into your account if not done yet, then click "Approve") ; once this is done, SGGOG now stores an API token belonging to this user, and exposes it at `/token` for any program to obtain (see the exact response format below).  
If the token is expired, SGGOG will refresh it before answering the request.

Again, keep in mind that this falls completely outside of a "normal" use of OAuth, because it is completely unsafe ; anyone able to send queries to SGGOG's HTTP server will be able to authenticate to start.gg's API as the user. Always make sure this can't happen. For example, it is highly recommended to open the server to the local machine only (i.e. use the 127.0.0.1, the default). 

### Saving
By default, SGGOG keeps the token only in memory, and lost if SGGOG stops. It can be saved to the filesystem using the `-S <path>` option or the `-s` flag (saves to `~/.goomba-sgg-tools/sgg-oauth-data.json`).  
This will save your token in clear in your filesystem, which might seem unsafe, but it's not *more* unsafe than exposing it on a local HTTP endpoint already is anyways.  

## API
### HTTP Response
The HTTP response for `/token` token queries can be as follow : 
- Status **200** : A token is returned as the response body (token only, without the "Bearer" part)
- Status **401** (Error) : No token saved, the start.gg OAuth authorization hasn't been completed yet
- Status **500** (Error) : Internal error

Note that these queries (like most of the OAuth logic) are handled by startgg-oauth-helper, and as such it should work in the same way as any server using that library

### Program interface (reference)
Detailed list of the CLI interface and possible environment variables ; all of this has already explained, this is just a reference. 

Effect | Env variable | CLI Argument
-|-|-
OAuth parameters | SGG_OAUTH_CLIENT_ID <br> SGG_OAUTH_REDIRECT_URI <br> SGG_OAUTH_CLIENT_SECRET | -
Host | HOST | -H / --host
Port | PORT | -p / --port 
Save token to file | - | -s / -S