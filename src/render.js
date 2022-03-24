const { dialog } = require("electron").remote;
const path = require("path");
const fs = require("fs");
const md5 = require('blueimp-md5');
const $ = require('jquery');

const viewerElement = document.getElementById("viewer");

const openFileBtn = document.getElementById("open");
const saveFileBtn = document.getElementById("save");
const transData = document.getElementById("trans_data");

WebViewer({
        path: "../public/lib",
        initialDoc: "../public/files/webviewer-demo-annotated.pdf",
    },
    viewerElement
).then((instance) => {
    // Interact with APIs here.
    // See https://www.pdftron.com/documentation/web for more info
    instance.setTheme("dark");
    instance.disableElements(['downloadButton']);

    const { documentViewer, annotationManager } = instance.Core;

    const { Feature, iframeWindow } = instance.UI;
    instance.UI.enableFeatures([Feature.FilePicker]);
    // currentDoc.instance.UI.enableFeatures([Feature.Download]);

    // documentViewer.addEventListener("documentLoaded", () => {
    //     const rectangleAnnot = new Annotations.RectangleAnnotation({
    //         PageNumber: 1,
    //         // values are in page coordinates with (0, 0) in the top left
    //         X: 100,
    //         Y: 150,
    //         Width: 200,
    //         Height: 50,
    //         Author: annotationManager.getCurrentUser(),
    //     });
    //     annotationManager.addAnnotation(rectangleAnnot);
    //     annotationManager.redrawAnnotation(rectangleAnnot);
    // });
    //  const iframeWindow = currentDoc.instance.UI.iframeWindow;
    iframeWindow.addEventListener('copy', function(e) {
        console.log('Ctrl+C (copy) pressed');
        showSelectedText();
    });
    const showSelectedText = () => {
        const page = documentViewer.getCurrentPage();
        const text = documentViewer.getSelectedText(page);

        if (!!text) {
            console.log(text);
            console.log(typeof text);
            var clean_text = (text + '').replace(/\n/g, "");
            textTranslate(clean_text)
        }
    }


    openFileBtn.onclick = async() => {
        const file = await dialog.showOpenDialog({
            properties: ["openFile", "multiSelections"],
            filters: [
                { name: "Documents", extensions: ["pdf", "docx", "pptx", "xlsx"] },
                { name: "Images", extensions: ["png", "jpg"] },
            ],
        });

        if (!file.canceled) {
            console.log("path: " + file.filePaths[0]);
            console.log(file)
            instance.loadDocument(file.filePaths[0]);
        }
    };

    saveFileBtn.onclick = async() => {
        const file = await dialog.showOpenDialog({
            title: "Select where you want to save the PDF",
            buttonLabel: "Save",
            filters: [{
                name: "PDF",
                extensions: ["pdf"],
            }, ],
            properties: ["openDirectory"],
        });

        if (!file.canceled) {
            const doc = documentViewer.getDocument();
            const xfdfString = await annotationManager.exportAnnotations();
            const data = await doc.getFileData({
                // saves the document with annotations in it
                xfdfString,
            });
            const arr = new Uint8Array(data);

            fs.writeFile(
                `${file.filePaths[0].toString()}/annotated.pdf`,
                arr,
                function(err) {
                    if (err) throw err;
                    console.log("Saved!");
                }
            );
        }
    };
});

function textTranslate(clean_text) {
    // 初始化要传递给API的数据
    var appid = '20220314001123604';
    var key = 'HjrMtN75IbrzxkZeVY2b';
    var salt = (new Date).getTime();
    var query = clean_text;
    var from = 'auto';
    var to = "zh";
    var str1 = appid + query + salt + key;
    var sign = md5(str1);

    $.ajax({
        url: 'http://api.fanyi.baidu.com/api/trans/vip/translate',
        type: 'get',
        dataType: 'jsonp',
        data: {
            q: query,
            appid: appid,
            salt: salt,
            from: from,
            to: to,
            sign: sign
        },
        success: function(data) {
            console.log(data);
            transData.innerHTML = data.trans_result[0].dst;
        }
    })
};