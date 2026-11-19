const gqlDocument = `
query CurrentUserInfo {
	currentUser {
    player {
      gamerTag
    }
  }
}
`

const reqBody = JSON.stringify({query: gqlDocument});

/** @param {string} token  */
export async function getUserInfo(token){
    const result = await fetch("https://api.start.gg/gql/alpha", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token
        },
        body: reqBody
    }).then(res => {
        if (!res.ok){
            throw "start.gg API responded with code " + res.status;
        }

        return res.json();
    });

    if (!result.data.currentUser) throw "No user for token, token is most likely invalid (still weird tho)";
    if (!result.data.currentUser.player) throw "Logged user has no player (????)";

    return result.data.currentUser.player.gamerTag;
}