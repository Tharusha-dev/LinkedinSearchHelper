const httpReqUrlPattern = 'https://www.linkedin.com/voyager/api/relationships/dash/*'
const regexPatternStart = '/start=(\d+)/'
const regexPatternCount = '/count=(\d+)/'

chrome.runtime.onMessage.addListener(

    function (request, sender, sendResponse) {
        sendResponse("got")
        if (request.greeting == "hello") {

            sendResponse({ farewell: "goodbye" });
            // console.log("hi from background")

            chrome.webRequest.onBeforeSendHeaders.addListener(
                sendUrl,
                { urls: [httpReqUrlPattern] },
                ["requestHeaders"]

            );
        }
        return true;
    });

function updateURLParameters(url, numOfCon, start) {
    let updatedURL = url.replace(/count=\d+/, `count=${numOfCon}`);
    updatedURL = updatedURL.replace(/start=\d+/, `start=${start}`);
    return updatedURL;
}


async function getRequests(numOfRequests, lastRequestNumOfElements, reqMethod, fetchHeaders, reqUrl) {
    console.log("got into getRequest")
    let start = 0
    let connectionsArray = []
    for (let i = 0; i < numOfRequests; i++) {
        let newUrl = updateURLParameters(reqUrl, 100, start)


        start += 100


        fetch(newUrl, {
            method: reqMethod,
            headers: fetchHeaders,
        }).then(response => {

            response.json().then((data) => {
                connectionsArray.push(...data['included'].splice(0, parseInt(numOfRequests)))

                console.log(`from getRequest cycle => i : ${i}`)

                console.log(`from getRequest cycle => start : ${start}`)
                console.log(`from getRequest cycle => newUrl : ${newUrl}`)

                // console.log(`from getRequest cycle => connectionsArray : ${connectionsArray}`)

                // console.log(connectionsArray)
                // let csvText = exportToCSV(connectionsArray)
                // // console.log(csvText)
                // chrome.storage.sync.set({ 'csvText': csvText })
                // chrome.runtime.sendMessage({ greeting: "showCSVdownload" }, function (response) {

                // });


            })
        })
            .catch(error => {

                console.error(error);
                return false
            });

    }

    if (lastRequestNumOfElements != 0) {
        console.log(`from getRequest cycle => newUrl : ${newUrl}`)

        let newUrl = updateURLParameters(reqUrl, lastRequestNumOfElements, start)

        fetch(newUrl, {
            method: reqMethod,
            headers: fetchHeaders,
        }).then(response => {

            response.json().then((data) => {
                connectionsArray.push(...data['included'].splice(0, parseInt(lastRequestNumOfElements)))



            })
        })
            .catch(error => {

                console.error(error);
                return false
            });
    }

    let csvText = exportToCSV(connectionsArray)
    // console.log(csvText)
    chrome.storage.sync.set({ 'csvText': csvText })
    chrome.runtime.sendMessage({ greeting: "showCSVdownload" }, function (response) {

    });

    return true

}




function sendUrl(reqDetails) {
    // console.log(`Loading: ${reqDetails.url}`)

    if (reqDetails != undefined) {
        var reqUrl = reqDetails.url

        chrome.storage.sync.get().then((val) => {

            let numOfConnectionsInt = parseInt(val["numOfConnections"])
            let numOfElementsInt = parseInt(val['numOfElements'])
            let numOfConnetionsToGet = 0

            if (numOfElementsInt > numOfConnectionsInt) {
                numOfConnetionsToGet = val['numOfConnections']
            } else {
                numOfConnetionsToGet = val['numOfElements']

            }

            console.log(`from send url numOfConnectionsInt : ${numOfConnectionsInt}`)
            console.log(`from send url numOfElementsInt : ${numOfConnectionsInt}`)
            console.log(`from send url numOfConnectionsToGet : ${numOfConnetionsToGet}`)








            var reqHeaders = reqDetails.requestHeaders
            // console.log(`reqHeaders ${reqHeaders}`)

            var reqMethod = reqDetails.method
            // console.log(`reqUrl ${reqMethod}`)

            // Convert headers to Fetch API format
            let fetchHeaders = new Headers();
            let headers = {}

            // console.log(fetchHeaders.values())
            reqHeaders.forEach(header => {
                fetchHeaders.append(header.name, header.value);
                headers[header.name] = header.value
            });

            if (parseInt(numOfConnetionsToGet) > 100) {

            console.log(`from send url numOfConnections to get is bigger than 100`)


                let requestChunks = Math.floor(parseInt(numOfConnetionsToGet) / 100)
                let lastReqestNumberOfElements = parseInt(numOfConnetionsToGet) % 100

            console.log(`from send url requetChunks : ${requestChunks}`)
            console.log(`from send url lastNumberOfELement : ${lastReqestNumberOfElements}`)



                getRequests(requestChunks, lastReqestNumberOfElements, reqMethod, fetchHeaders, reqUrl).then((res) => {
                    if (res) {
                        console.log("done")
                    } else {
                        console.log("error")
                    }
                })




            } else {
            console.log(`from send url numOfConnections to get is NOT bigger than 100`)

                let newUrl = updateURLParameters(reqUrl, numOfConnetionsToGet, 0)
            console.log(`from send url numOfConnections to get is NOT bigger than 100 and new url : ${newUrl}`)



                fetch(newUrl, {
                    method: reqMethod,
                    headers: fetchHeaders,
                }).then(response => {

                    response.json().then((data) => {
                        let connectionsArray = data['included'].splice(0, parseInt(numOfConnetionsToGet))
                        // console.log(connectionsArray)
                        let csvText = exportToCSV(connectionsArray)
                        // console.log(csvText)
                        chrome.storage.sync.set({ 'csvText': csvText })
                        chrome.runtime.sendMessage({ greeting: "showCSVdownload" }, function (response) {

                        });


                    })
                })
                    .catch(error => {

                        console.error(error);
                    });

            }








            // fetch(newUrl, {
            //     method: reqMethod,
            //     headers: fetchHeaders,
            // }).then(response => {

            //     response.json().then((data) => {
            //         let connectionsArray = data['included'].splice(0, parseInt(numOfConnetionsToGet))
            //         // console.log(connectionsArray)
            //         let csvText = exportToCSV(connectionsArray)
            //         // console.log(csvText)
            //         chrome.storage.sync.set({ 'csvText': csvText })
            //         chrome.runtime.sendMessage({ greeting: "showCSVdownload" }, function (response) {

            //         });


            //     })
            // })
            //     .catch(error => {

            //         console.error(error);
            //     });

        })


    } else {
        // console.log(`says undefined ${reqDetails}`)
    }


}



function exportToCSV(connectionsArray) {
    let csv = "firstName,lastName,headline\n"
    // console.log(typeof (connectionsArray))

    connectionsArray.forEach((connection) => {
        let row = connection['firstName'] + ',' + connection['lastName'] + ',' + connection['headline'] + '\n'
        csv += row

    })

    return csv

}

