import axios from 'axios'
import get from 'lodash.get'

const getId = async accName => {
    return await axios
        .get(
            `https://www.instagram.com/web/search/topsearch/?context=user&count=0&query={${accName}}`
        )
        .then(function(response) {
            // handle success
            const igId = get(response, 'data.users[0].user.pk')
            return igId
        })
        .catch(function(error) {
            // handle error
            console.log(error)
        })
}

const getAllPosts = async (id, lastPost = '') => {
    return await axios
        .get('https://www.instagram.com/graphql/query/', {
            params: {
                query_hash: 'e769aa130647d2354c40ea6a439bfc08',
                variables: { id: id, first: 50, after: lastPost }
            }
        })
        .then(async response => {
            // handle success
            console.log(
                'The IG User Id is:',
                get(
                    response,
                    'data.data.user.edge_owner_to_timeline_media.edges'
                )
            )
            const hasNextPage = get(
                response,
                'data.data.user.edge_owner_to_timeline_media.page_info.has_next_page',
                false
            )

            const results = get(
                response,
                'data.data.user.edge_owner_to_timeline_media.edges',
                []
            )

            if (hasNextPage) {
                const lastPage = get(
                    response,
                    'data.data.user.edge_owner_to_timeline_media.page_info.end_cursor'
                )
                return results.concat(await getAllPosts(id, lastPage))
            } else {
                return results
            }
        })
        .catch(function(error) {
            // handle error
            console.log(error)
        })
}

const extractLocations = list => {
    return list.reduce((acc, item) => {
        const location = get(item, 'node.location', false)
        if (location) {
            return acc.concat(location)
        }
        return acc
    }, [])
}

const login = async () => {
    // TODO: fix this. Rebuild it into Promisestyle. Not working atm
    return axios
        .post(`https://www.instagram.com/accounts/login/ajax/`, {
            headers: {
                Accept: '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                Connection: 'keep-alive',
                Host: 'www.instagram.com',
                Origin: 'https://www.instagram.com',
                Referer: 'https://www.instagram.com/',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0',
                'X-Instagram-AJAX': '1',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(json => {
            console.log('extract lat and lng')
            console.log(json)
            return json
        })
}

const getLatLng = async locations => {
    if (locations == []) {
        return []
    } else {
        return await axios
            .get(
                `https://www.instagram.com/explore/locations/${locations[0].id}/${locations[0].slug}/?__a=1`
            )
            .then(async response => {
                // handle success
                console.log(response)
                locations = locations.slice(1, locations.length)
                return [response].concat(await getLatLng(locations))
            })
            .catch(function(error) {
                // handle error
                console.log(error)
            })
    }
}

login()

// getId('kevadams') //kevadams is the perfect test accout because he tags almost every image with a geolocation
//   .then(id => getAllPosts(id))
//   .then(posts => {
//     posts = posts.slice(0, 10) //TODO: this limit should get removed when going live
//     console.log('posts', posts)
//     return posts
//   })
//   .then(posts => {
//     console.log('locations', extractLocations(posts))
//     getLatLng(extractLocations(posts))
//   })
//   .then(geos => {
//     console.log(geos)
//   })
