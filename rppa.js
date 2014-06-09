(function () {
    "use strict";

    /*global TCGA:true, angular:true */

 // Load dependencies.
    TCGA.loadScript({
        registerModules: false,
        scripts: [
            "https://ajax.googleapis.com/ajax/libs/angularjs/1.0.2/angular.min.js",
            "https://agrueneberg.github.io/Spearson/lib/spearson.js",
            "https://cdnjs.cloudflare.com/ajax/libs/d3/2.10.0/d3.v2.min.js",
            "https://agrueneberg.github.io/D3.heatmap/heatmap.js",
            "https://agrueneberg.github.io/D3.dendrogram/dendrogram.js"
        ]
    }, function () {

        var app;

        app = angular.module("app", []);

     // A simple store service to bridge between controllers.
        app.factory("store", function ($q) {
            var store;
            store = {};
            return {
                set: function (key, value) {
                    var deferred;
                    deferred = $q.defer();
                    store[key] = value;
                    deferred.resolve();
                    return deferred.promise;
                },
                get: function (key) {
                    var deferred;
                    deferred = $q.defer();
                    deferred.resolve(store[key]);
                    return deferred.promise;
                }
            };
        });

        app.factory("rppa", function ($rootScope, $q, $http) {
            var get, normalizeAntibodyName;
            get = function (link) {
                var deferred;
                deferred = $q.defer();
                TCGA.get(link, function (err, res) {
                    $rootScope.$apply(function () {
                        if (err !== null) {
                            deferred.reject(err);
                        } else {
                            deferred.resolve(res);
                        }
                    });
                });
                return deferred.promise;
            };
            normalizeAntibodyName = function (antibody) {
                return antibody.match(/(.*)-\w+-\w+/)[1];
            };
            return {
                fetchLinks: function () {
                 // This function is implemented as a promise because it used to
                 // query the links directly from the TCGA Roadmap. Once we find
                 // a faster and more stable solution for storing the Roadmap, we
                 // may switch back to the dynamic approach.
                    var deferred, links;
                    deferred = $q.defer();
                    links = [
                        "00da2077-778c-418a-9c92-01febd970ed8",
                        "0164e0da-6ae8-47c7-9e59-89cd51695ed7",
                        "037eb625-e586-44f1-b3e3-3e9db219d6ef",
                        "03f86eaa-264d-43f6-bb20-6d0a0f5646a2",
                        "0570d1aa-b365-4ef1-be78-9fcc56c38b08",
                        "05f06ab4-9ab9-4875-8aac-e0202526dc10",
                        "06128884-ad24-4362-8f62-2af1e1682efa",
                        "073fb0fd-72b4-4c20-8e6b-5e485c166bd8",
                        "09e53e65-996f-4acf-875b-3734e1c290d5",
                        "0a6a0bf5-cfb9-437e-a3cf-7f83a234a753",
                        "0af04035-e7c0-4f53-9a17-f01a79061fcf",
                        "0d1dc196-0aac-401b-b52a-1f7fa6c3eb51",
                        "0dad4954-03a3-4e1e-9453-370f8b774df1",
                        "0fb2e38a-f102-4701-a5fb-6e67edef949c",
                        "10225288-a742-43af-88ea-dd5af14cafcc",
                        "10cf9362-627b-4377-910a-f86386629a18",
                        "1160c00e-509b-442a-bdc7-e80122ade8c3",
                        "11edf55b-ebad-41d7-b9b4-1b2436ecbef9",
                        "12342d39-e405-4bea-b5d7-cb5c2c432049",
                        "12ad8b00-5272-48e4-9a07-7dcee9629b0c",
                        "13466f39-ae8a-4426-93a0-ce9f80b85b2f",
                        "150b6b4c-af07-44ce-9bb8-b57e6168f565",
                        "152ded50-5f0f-4824-ae75-4e8d6a662801",
                        "177ad838-b22a-4053-9578-55539b095536",
                        "17b09ac4-23b8-4a1d-9723-eb76226d52dc",
                        "17c0def9-6a68-48f4-a337-f2f62be7d559",
                        "18cb56a6-8c49-4134-be47-cd50e5c15b0c",
                        "1a98c6d9-6099-4f33-bcbc-fbaf75b4e813",
                        "1c2541fb-f2f0-4695-9c45-87ba8b334f09",
                        "1db599c9-086a-427e-b45d-680d456973bf",
                        "1e63cb0a-a813-4b0b-8502-1fbd467efad8",
                        "1f36a259-0057-4dd8-a4d6-fe0d3993530e",
                        "1f58530e-6717-4f3e-a9a4-77c5510d8601",
                        "21d23913-0a8a-4894-8faa-be5977c351bd",
                        "221815cf-2428-45c0-abb1-cf5e4d9f72b1",
                        "221cede5-2c8c-4a8f-a3cb-a0cfe1ce8d3b",
                        "2333aa36-c554-413b-a4ca-8193f842fbfb",
                        "2546a0d1-e369-40ef-80f5-cb5c53c3f8e1",
                        "256dba19-5a06-4864-afa0-0f2cb2865f2b",
                        "2734472e-f6d6-49a7-a492-da03db852ac7",
                        "27843d7c-55e0-4b81-9463-13865d275de0",
                        "2b0b245d-2360-4ea2-a8b0-69c570c9ff52",
                        "2b3b15cd-e9ff-4336-a141-9e1e8c2de2c8",
                        "2b4483ff-1cc5-4df0-9054-ec7704d14699",
                        "2ce4d637-7957-4afe-bdbc-4f8c970a4c0d",
                        "2f30d9c1-bb72-49d1-bb42-b1265e0e9032",
                        "347c73c7-4af8-401a-a1ef-41f512704cce",
                        "34ab865a-8fe5-47a3-ae8f-476470f04944",
                        "3822fe68-dc69-483b-8b17-4b41485b2ee4",
                        "38f13667-ac0a-4a3b-854a-6a925b76dc95",
                        "3944b48f-eda9-49ea-b8a3-b92bedebf6f9",
                        "39559258-6e2b-4ddc-86a9-679697fda21a",
                        "39994b0a-558a-43b3-8f79-bccbc69ab44d",
                        "39e3cdd1-1b6e-43a9-a6c9-857f4d764d37",
                        "3a85a0cd-37d5-41a6-b14e-54c800fafa5c",
                        "3a8b14d1-5fac-4df5-8513-59e772079799",
                        "3ac9d2c2-5efb-4fe2-82a1-693ffeb5cd66",
                        "3b509d15-abfc-4034-a7c7-69ef5c7c1871",
                        "3b9ba5c7-c29d-4eb4-a204-38f3c14e4ee2",
                        "42dbb994-d30a-492b-bbef-987ea23bb1f0",
                        "4377c499-0000-4621-bdac-fd922fdf3cf8",
                        "43a300a5-5f7b-4639-859b-cf5afe301efa",
                        "46538af0-dd55-4753-b74c-79013d866b7e",
                        "466114ee-7208-41d3-850e-3e92088e1377",
                        "491f0c6a-f6b6-4385-a102-a61da6e5927f",
                        "495c07c0-9178-4b56-acba-0f9c6f228678",
                        "4a786726-1236-4490-a84b-6bd984724463",
                        "4bd90850-af4b-44b1-9f36-c9c5f069b093",
                        "4be2f5df-6a39-4998-b285-258bef4aeca6",
                        "4c56b96b-33b0-41d3-a924-cc089926e109",
                        "4d90f731-ec9e-4cd5-b541-b812c0e5f062",
                        "4db7fb95-2ea7-41c9-a7d6-91aea77da823",
                        "4f52ad16-3d76-4dd8-a056-9529069bae1b",
                        "50c129bf-2b93-475d-9845-77970d241f35",
                        "524304ce-dd99-4b59-b379-7cc2da965112",
                        "52bca262-417c-4391-90ec-649367f28c45",
                        "547ffa10-748d-47d9-ba26-ed62fe26109e",
                        "548548c5-d34d-4a34-b095-f3f98ceb8272",
                        "54a91ae4-7e11-4183-aeb9-8dcc5d34f444",
                        "54cc97d7-a00c-440f-88fe-1be331422147",
                        "56d09cb9-ac05-47cc-a59d-fde096fcdaa4",
                        "571d0b0a-9c31-42e0-8d55-e83363bf06cb",
                        "5728e751-d905-4be5-bd25-8ac1b067880e",
                        "5739c85b-2e30-4ac3-91fa-01d4592dd586",
                        "5808b35f-107d-44a3-855a-10b5370c180f",
                        "589d0724-c23d-4c04-96cd-f5aa62e3567b",
                        "58c26f51-eda9-4e03-bb0d-76841b30dd3b",
                        "59eb7b30-4000-4feb-9543-1fe085fdef6a",
                        "5a3f6d91-b104-4ca5-afed-b0a0c730f845",
                        "5aac1046-2cb5-45c5-83cc-4d965722a97b",
                        "5c259e4a-4f44-410b-bd65-443cbb36853b",
                        "5e729c77-8ee6-41c4-a5a5-d516f2d5c0f1",
                        "5e976301-e482-4e82-98c1-57aa7f0a90dd",
                        "600de577-851e-4fc8-82ae-5dea84ae5dc2",
                        "601a9a0a-64f8-46c4-b335-71a047cc3001",
                        "60fa2af0-1071-4cc0-a72f-1d548a90eeef",
                        "61048bc0-ecba-4207-a066-148a097dcd8b",
                        "6111e87e-86bb-4c70-81d3-63d7dfdfa754",
                        "616b8910-4664-479e-b880-f012db8f0198",
                        "62829a16-4df9-433f-ab7f-964cbd9e55ac",
                        "646e2985-6966-48c4-bc5f-50d4eaa9714f",
                        "650c3f91-d7b5-487d-bf38-e3f563d8dfa3",
                        "65f38da2-027b-4c58-91c9-725469ff3415",
                        "663b4d7c-cf18-4096-aa7c-b0c05847f391",
                        "66be4003-2f4d-4e44-a92a-12a3fb5b781a",
                        "694947b3-aa7e-4ae1-b843-bc8a9e4e1a1f",
                        "6b14af2a-4ab8-411d-b021-8584038524ea",
                        "6c9cd0c5-5a65-423e-9fd7-0fa5a61cf724",
                        "6d41d8c9-f2bf-4440-8b8d-907e3b2682f5",
                        "6e6efa4e-0c92-4aee-9c5f-7a9aeb6f1283",
                        "6f9a8ffa-448b-4227-9e3e-f574519692fb",
                        "72d033c7-fd16-4b1f-995e-f59b2014962f",
                        "72f9a86a-be9e-415a-bf20-cb10ad68b941",
                        "7403aaa0-0d28-4e7c-b6d4-7c9a9fd16511",
                        "7445d5a7-ffb8-4ee5-a774-11feddac42d8",
                        "76c6a2d9-0d23-47ff-be57-79f3b7025483",
                        "79ef6ff8-6029-4c8d-9480-67cf9b00a0e1",
                        "7d1d7b71-cf07-4755-92c2-271d662d0019",
                        "7e55da41-a765-453f-af47-dc2175559916",
                        "822803a4-f4ee-4b6b-9304-26d1423ae675",
                        "8244a4d3-b19d-48f8-b7de-c483a7974aa2",
                        "82a866c5-37d5-44bf-ac7e-2f0ea1860990",
                        "83c35236-6a44-4471-a603-5b11d9e1d9c5",
                        "83e4b8f7-4dbe-44bd-8737-9512e418bfa2",
                        "84f9e6c4-425a-43e2-95b4-bb889a9b7e9e",
                        "8868fbdf-a7b1-421e-8ee0-2ac648add16f",
                        "88f77796-6e53-4004-b996-daf4a9d277b0",
                        "8918071d-2625-44ce-a8a4-5ebc0eb93d68",
                        "90bb9ce6-a8c8-4dd3-9bc7-416da3f8e112",
                        "93a1ba70-318e-4f2c-95ad-7491dfc55d9a",
                        "97828ac5-c38b-4c35-8341-a39b0a7ecaf9",
                        "9809e8f6-2c4f-4206-a674-b104ad1d9a81",
                        "99585ff1-09dd-44a2-bf7d-d675ded1e3ba",
                        "9cf8a97f-c4dc-41e4-b460-0e73a5f9d84f",
                        "9db41fdc-efd2-4999-918a-61199d9f3571",
                        "9dd52428-ff30-4243-867d-03c0a5ac544c",
                        "9ef5a975-00b9-4d33-aeea-990f116e13d5",
                        "9f726ed0-1d19-41e9-b0ac-58ed5321c549",
                        "9f920614-c96a-4335-bbbd-e4a7b97a4136",
                        "a0087893-e3d3-4a75-8148-ad3ef13442ec",
                        "a008a42b-af81-4d9a-bc8b-c946aff4535a",
                        "a385b9fa-2e8e-43c7-a70a-a25c7db5c2ee",
                        "a4364dd3-95dc-45c6-894c-312cc5105aca",
                        "a471846e-b17f-40df-9dbd-c2c4cb580fb4",
                        "a6c19e04-9c30-4c3b-9a60-9315fe1fb119",
                        "a84e840e-8e03-4c6c-9c8a-9664b9ae2759",
                        "a9537862-cb39-4a43-b226-729ba8207ec3",
                        "aa7f288e-d057-44f6-bc6c-02f48e2ebe68",
                        "ab877aac-d4e5-4404-9768-d8e5f64b71a8",
                        "ac164aa1-6ebb-4cee-8d3f-3a2741b1261b",
                        "ac685062-a228-4959-98d7-21302fe9b3fc",
                        "ac952e7d-aecb-4e22-9d4f-3395a89d4e3a",
                        "add756a2-ca98-4fa3-a64c-bd8ceb2dbcbb",
                        "af0ea213-1c05-44bc-813c-5bd42d3b4956",
                        "b0cc55a7-282b-40de-81b2-58ce7ca1d082",
                        "b1d3644b-8d22-4a19-854b-cf629a47ab86",
                        "b2a01b49-6377-485e-bfbd-3a744e11b6d0",
                        "b85e2f63-0899-40bc-bad1-3110dba9b83e",
                        "b94854d7-8049-4917-9082-2ed04aea155d",
                        "b9fc1d37-b629-436b-b83c-70183ca4d424",
                        "ba5a1b26-c06a-4817-a675-d3016dafaed0",
                        "bb49626a-bf58-44ca-ae6d-1a913ecc4808",
                        "bbc7c414-e324-436a-8fb6-d8eb9eb90ec6",
                        "bc3f01b7-d52c-4212-850f-20acd1c82985",
                        "bd77e935-9c7a-4c6a-affb-14646b15718f",
                        "bdffd7fb-2e88-48c7-a450-9f2860566dd0",
                        "bf4c2b75-25ec-427a-867f-dbe4ce01a56e",
                        "bf5343b3-d843-45ad-8d3e-e20106e95efc",
                        "bf8a4e6e-99f6-4563-a905-10bc07eb9bc0",
                        "c0f6b36e-b4a4-47c1-a20c-c314bffc373b",
                        "c29524e7-9090-4a4a-bc79-408f4bd8e767",
                        "c523421d-762c-470d-b5c1-f85d2d6e6525",
                        "c67ecef7-a80a-4bf7-bf3b-7f428d6cf4ec",
                        "c7905f20-713a-4460-8f05-d5db096ba210",
                        "c7e2c38f-276c-4ccf-ba2b-0ae4bdfa10da",
                        "caf43f47-184a-4cc9-b1a1-7e060fa370a0",
                        "cfb548c7-9550-4de9-87b9-f0f4919d60c0",
                        "d215d723-4a1f-4b41-8e9d-9a724c7f0245",
                        "d3b16bdb-79d5-4101-a8b2-596545f70575",
                        "d497694b-4847-4a84-902d-d4dab157020e",
                        "d7a98bdc-a815-4208-9336-3a12091d7200",
                        "dbc58ea1-a65f-450b-bdcc-a08a6b7af4d8",
                        "dc2b1b2a-b801-475c-90a7-452c6373e419",
                        "dc594807-719a-40d9-b16c-d5e8f9d36618",
                        "de113745-fe68-4a2f-8ffa-89ec2fd279c0",
                        "e24c9ab2-76a7-4ee2-9504-3bd6531dc8d2",
                        "e44f5c03-1737-4400-aaf9-4ef8be13dae9",
                        "e784ccb4-a624-4505-bd4c-281903c580f8",
                        "e7d0ae11-32cb-4949-8912-09c79fd104f1",
                        "e7f98bbb-0d9b-4b63-8eef-fb1a71d2247e",
                        "ea0102a6-3abc-4ae2-9dbd-635cdba59668",
                        "ea383ed3-3bf7-4364-84f0-d2bfea9a84fd",
                        "ec9bd938-c31e-482a-8f2f-8007de261d9a",
                        "eceddc68-f41a-489d-8338-98987c44d046",
                        "ed2c63c0-bb56-4077-9472-09301fb99dbb",
                        "ee515c71-5304-4c6e-be4e-9fdda8cc33e3",
                        "ef363e52-a7ac-4126-b379-59eb7e15d8b8",
                        "efb53f89-6737-4a60-bcae-2813882d9d4c",
                        "f07c053e-9707-43c4-a48a-7c9e6ef7a540",
                        "f15473f4-c0fc-4b7b-82e7-14ac213bec7d",
                        "f25392fe-b9ba-47c2-9522-6f71624000b7",
                        "f3c50699-de8d-4c4f-9f9e-04626254f2f9",
                        "f3ebb084-c9cd-486d-8dca-0c661921e401",
                        "f57d1168-8031-4b12-9e63-b867a2961a2f",
                        "f5838d07-90b2-469c-a52b-7e50f0da5d31",
                        "f72ff5f1-e84b-4e78-83a4-5e422303679a",
                        "f79641d3-b0c5-4171-954d-b049bb088015",
                        "f9af1caa-715c-4632-a7b3-5b4dc8cd8c6a",
                        "f9fe7a5c-f194-45d3-b96f-fbe1062b9ee7",
                        "fa32718b-f72e-4d1f-bcdc-6635894488f2",
                        "fc32f1f9-8457-498e-894e-e73aac10586a",
                        "ff015de2-3553-4662-bc8f-4998e6d1c2f9",
                        "ff1c78d0-c609-4c75-8397-6abe08e82b47",
                        "ff4890d1-67e8-4d62-b116-2b049753f6ee",
                    ];
                 // Prepend and append the rest of the link.
                    links = links.map(function (id) {
                        return "https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/gbm/cgcc/mdanderson.org/mda_rppa_core/protein_exp/mdanderson.org_GBM.MDA_RPPA_Core.Level_3.1.0.0/mdanderson.org_GBM.MDA_RPPA_Core.protein_expression.Level_3." + id + ".txt";
                    });
                    deferred.resolve(links);
                    return deferred.promise;
                },
                fetchFiles: function (links) {
                    var promises;
                    promises = links.map(function (link) {
                        return get(link);
                    });
                    return $q.all(promises);
                },
                fetchSlides: function () {
                 // Just like with fetchLinks, this function is implemented as a
                 // promise because it used to query the links directly from the
                 // TCGA Roadmap.
                    var deferred, links;
                    deferred = $q.defer();
                    links = [
                        "14-3-3_epsilon-M-C_GBL9017330",
                        "4E-BP1-R-V_GBL9017211",
                        "4E-BP1_pS65-R-V_GBL9017210",
                        "4E-BP1_pT37-R-V_GBL9017379",
                        "4E-BP1_pT70-R-C_GBL9017380",
                        "53BP1-R-C_GBL9017212",
                        "ACC1-R-C_GBL9017214",
                        "ACC_pS79-R-V_GBL9017213",
                        "AIB1-M-V_GBL9017331",
                        "AMPK_alpha-R-C_GBL9017218",
                        "AMPK_pT172-R-V_GBL9017219",
                        "AR-R-V_GBL9017221",
                        "ARID1A-M-V_GBL9017417",
                        "ATM-R-C_GBL9017381",
                        "Akt-R-V_GBL9017215",
                        "Akt_pS473-R-V_GBL9017216",
                        "Akt_pT308-R-V_GBL9017217",
                        "Annexin_I-R-V_GBL9017355",
                        "B-Raf-M-NA_GBL9017350",
                        "Bak-R-C_GBL9017222",
                        "Bax-R-V_GBL9017223",
                        "Bcl-2-R-NA_GBL9017409",
                        "Bcl-X-R-C_GBL9017224",
                        "Bcl-xL-R-V_GBL9017225",
                        "Beclin-G-V_GBL9017376",
                        "Bid-R-C_GBL9017226",
                        "Bim-R-V_GBL9017227",
                        "C-Raf-R-V_GBL9017305",
                        "C-Raf_pS338-R-C_GBL9017364",
                        "CD20-R-C_GBL9017382",
                        "CD31-M-V_GBL9017335",
                        "CD49b-M-V_GBL9017403",
                        "CDK1-R-V_GBL9017236",
                        "COX-2-R-C_GBL9017243",
                        "Caspase-3_active-R-C_GBL9017231",
                        "Caspase-7_cleavedD198-R-C_GBL9017232",
                        "Caspase-8-M-C_GBL9017333",
                        "Caspase-9_cleavedD330-R-C_GBL9017233",
                        "Caveolin-1-R-V_GBL9017235",
                        "Chk1-R-C_GBL9017237",
                        "Chk1_pS345-R-C_GBL9017238",
                        "Chk2-M-C_GBL9017336",
                        "Chk2_pT68-R-C_GBL9017239",
                        "Claudin-7-R-V_GBL9017241",
                        "Collagen_VI-R-V_GBL9017242",
                        "Cyclin_B1-R-V_GBL9017244",
                        "Cyclin_D1-R-V_GBL9017245",
                        "Cyclin_E1-M-V_GBL9017337",
                        "Cyclin_E2-R-C_GBL9017383",
                        "DJ-1-R-C_GBL9017246",
                        "Dvl3-R-V_GBL9017247",
                        "E-Cadherin-R-V_GBL9017228",
                        "EGFR-R-C_GBL9017250",
                        "EGFR_pY1068-R-V_GBL9017251",
                        "EGFR_pY1173-R-C_GBL9017252",
                        "EGFR_pY992-R-V_GBL9017253",
                        "ER-alpha-R-V_GBL9017255",
                        "ER-alpha_pS118-R-V_GBL9017256",
                        "ERCC1-M-C_GBL9017338",
                        "ERK2-R-NA_GBL9017414",
                        "FAK-R-C_GBL9017257",
                        "FOXO3a-R-C_GBL9017259",
                        "FOXO3a_pS318_S321-R-C_GBL9017260",
                        "Fibronectin-R-C_GBL9017408",
                        "GAB2-R-V_GBL9017261",
                        "GATA3-M-V_GBL9017415",
                        "GSK3-alpha-beta-M-V_GBL9017369",
                        "GSK3-alpha-beta_pS21_S9-R-V_GBL9017263",
                        "GSK3_pS9-R-V_GBL9017262",
                        "HER2-M-V_GBL9017370",
                        "HER2_pY1248-R-V_GBL9017411",
                        "HER3-R-V_GBL9017265",
                        "HER3_pY1298-R-C_GBL9017266",
                        "HSP70-R-C_GBL9017384",
                        "IGF-1R-beta-R-C_GBL9017267",
                        "IGFBP2-R-V_GBL9017268",
                        "INPP4B-G-C_GBL9017377",
                        "IRS1-R-V_GBL9017269",
                        "JNK2-R-C_GBL9017270",
                        "JNK_pT183_Y185-R-V_GBL9017354",
                        "K-Ras-M-C_GBL9017351",
                        "Ku80-R-C_GBL9017392",
                        "LKB1-M-NA_GBL9017416",
                        "Lck-R-V_GBL9017389",
                        "MAPK_pT202_Y204-R-V_GBL9017273",
                        "MEK1-R-V_GBL9017274",
                        "MEK1_pS217_S221-R-V_GBL9017358",
                        "MIG-6-M-V_GBL9017343",
                        "MSH2-M-C_GBL9017344",
                        "MSH6-R-C_GBL9017359",
                        "Mre11-R-C_GBL9017277",
                        "N-Cadherin-R-V_GBL9017229",
                        "NF-kB-p65_pS536-R-C_GBL9017280",
                        "NF2-R-C_GBL9017281",
                        "Notch1-R-V_GBL9017282",
                        "Notch3-R-C_GBL9017418",
                        "P-Cadherin-R-C_GBL9017230",
                        "PARP_cleaved-M-C_GBL9017345",
                        "PCNA-M-V_GBL9017346",
                        "PDK1_pS241-R-V_GBL9017295",
                        "PEA-15-R-V_GBL9017394",
                        "PI3K-p110-alpha-R-C_GBL9017296",
                        "PI3K-p85-R-V_GBL9017399",
                        "PKC-alpha-M-V_GBL9017347",
                        "PKC-alpha_pS657-R-V_GBL9017298",
                        "PKC-delta_pS664-R-V_GBL9017393",
                        "PR-R-V_GBL9017299",
                        "PRAS40_pT246-R-V_GBL9017300",
                        "PTCH-R-C_GBL9017362",
                        "PTEN-R-V_GBL9017302",
                        "Paxillin-R-V_GBL9017294",
                        "Rab11-R-V_GBL9017303",
                        "Rab25-R-C_GBL9017363",
                        "Rad50-M-C_GBL9017348",
                        "Rad51-M-C_GBL9017349",
                        "Rb-M-V_GBL9017352",
                        "Rb_pS807_S811-R-V_GBL9017307",
                        "S6-R-NA_GBL9017390",
                        "S6_pS235_S236-R-V_GBL9017308",
                        "S6_pS240_S244-R-V_GBL9017309",
                        "SETD2-R-NA_GBL9017395",
                        "STAT3_pY705-R-V_GBL9017315",
                        "STAT5-alpha-R-V_GBL9017316",
                        "Shc_pY317-R-NA_GBL9017310",
                        "Smac-M-V_GBL9017401",
                        "Smad1-R-V_GBL9017311",
                        "Smad3-R-V_GBL9017312",
                        "Smad4-M-V_GBL9017371",
                        "Snail-M-C_GBL9017372",
                        "Src-M-V_GBL9017373",
                        "Src_pY416-R-C_GBL9017313",
                        "Src_pY527-R-V_GBL9017314",
                        "Stathmin-R-V_GBL9017317",
                        "Syk-M-V_GBL9017374",
                        "TAZ-R-C_GBL9017391",
                        "TAZ_pS89-R-C_GBL9017318",
                        "Tau-M-C_GBL9017375",
                        "Transglutaminase-M-V_GBL9017405",
                        "Tuberin-R-C_GBL9017319",
                        "VASP-R-C_GBL9017320",
                        "VEGFR2-R-C_GBL9017386",
                        "XBP1-G-C_GBL9017406",
                        "XIAP-R-C_GBL9017322",
                        "XRCC1-R-C_GBL9017412",
                        "YAP-R-V_GBL9017324",
                        "YAP_pS127-R-C_GBL9017325",
                        "YB-1-R-V_GBL9017367",
                        "YB-1_pS102-R-V_GBL9017327",
                        "alpha-Catenin-M-V_GBL9017334",
                        "beta-Catenin-R-V_GBL9017234",
                        "c-Jun_pS73-R-C_GBL9017271",
                        "c-Kit-R-V_GBL9017419",
                        "c-Met-M-C_GBL9017342",
                        "c-Met_pY1235-R-C_GBL9017276",
                        "c-Myc-R-C_GBL9017279",
                        "cIAP-R-V_GBL90172401",
                        "eEF2-R-V_GBL9017248",
                        "eEF2K-R-V_GBL9017249",
                        "eIF4E-R-V_GBL9017254",
                        "mTOR-R-V_GBL9017385",
                        "mTOR_pS2448-R-C_GBL9017329",
                        "p21-R-C_GBL9017284",
                        "p27-R-V_GBL9017285",
                        "p27_pT157-R-C_GBL9017286",
                        "p27_pT198-R-V_GBL9017287",
                        "p38_MAPK-R-C_GBL9017288",
                        "p38_pT180_Y182-R-V_GBL9017289",
                        "p53-R-V_GBL9017360",
                        "p70S6K-R-V_GBL9017291",
                        "p70S6K_pT389-R-V_GBL9017292",
                        "p90RSK_pT359_S363-R-C_GBL9017293"
                    ];
                 // Prepend and append the rest of the link.
                    links = links.map(function (link) {
                        var antibodyName;
                        antibodyName = link.replace(/(.*)_.*/, "$1");
                        return {
                            name: normalizeAntibodyName(antibodyName),
                            uri: "https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/gbm/cgcc/mdanderson.org/mda_rppa_core/protein_exp/mdanderson.org_GBM.MDA_RPPA_Core.Level_1.1.0.0/" + link + ".tif",
                        };
                    });
                    deferred.resolve(links);
                    return deferred.promise;
                },
                fetchPatientInformation: function (barcodes) {
                    var deferred, endpoint, query;
                    deferred = $q.defer();
                    TCGA.get("https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/gbm/bcr/biotab/clin/nationwidechildrens.org_clinical_patient_gbm.txt", function (err, res) {
                        var lines, columns, patients;
                        lines = res.split("\n");
                        columns = lines.shift().split("\t");
                        patients = [];
                        lines.map(function (line) {
                            var fields, patient;
                            fields = line.split("\t");
                            if (barcodes.indexOf(fields[0]) !== -1) {
                                patient = {};
                                fields.forEach(function (value, idx) {
                                    patient[columns[idx]] = value;
                                });
                                patients.push(patient);
                            }
                        });
                        $rootScope.$apply(function () {
                            deferred.resolve(patients);
                        });
                    });
                    return deferred.promise;
                },
                mapUuidsToBarcodes: function (uuids) {
                    var deferred;
                    deferred = $q.defer();
                    TCGA.get.barcodes(uuids, function (err, res) {
                        $rootScope.$apply(function () {
                            if (err !== null) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(res);
                            }
                        });
                    });
                    return deferred.promise;
                },
                extractSampleId: function (uri) {
                    return uri.match(/Level_3\.([_a-zA-Z0-9-]+)\.txt$/)[1];
                },
             // Converts the data into the following denormalized form:
             // Sample_Reference_Id Composite_Element_Ref Antibody Antibody_Expression
                normalizeFile: function (file, ignoredAntibodies) {
                    var deferred, data, expressionLevels, sampleRef, compositeElementRef;
                    deferred = $q.defer();
                    data = [];
                    ignoredAntibodies = ignoredAntibodies || [];
                 // Parse file.
                    expressionLevels = {};
                    file.split("\n").forEach(function (line, i) {
                        var tuple, expression;
                     // Ignore empty lines.
                        if (line !== "") {
                            tuple = line.split("\t");
                            if (tuple[0] === "Sample REF") {
                             // Extract Sample REF.
                                sampleRef = tuple[1];
                            } else if (tuple[0] === "Composite Element REF") {
                             // Extract Composite Element REF.
                                compositeElementRef = tuple[1];
                            } else {
                             // Remove species and validation status from antibody names.
                             // See: http://goo.gl/KB4JZ
                                tuple[0] = normalizeAntibodyName(tuple[0]);
                             // Ignore given antibodies.
                                if (ignoredAntibodies.indexOf(tuple[0]) === -1) {
                                 // Extract antibodies and their expression levels.
                                    expression = Number(tuple[1]);
                                    expressionLevels[tuple[0]] = expression;
                                }
                            }
                        }
                    });
                 // I have never seen a case where Sample REF and Composite Element REF were not at the top,
                 // but parsing the whole document before writing them into the table is more robust and might
                 // prevent potential errors. Unless of course, those values are missing.
                    Object.keys(expressionLevels).map(function (antibody) {
                        data.push([sampleRef, compositeElementRef, antibody, expressionLevels[antibody]]);
                    });
                    deferred.resolve(data);
                    return deferred.promise;
                },
                mapAntibodyToGenes: function (antibody) {
                    var mapping;
                 // The mapping was extracted from http://goo.gl/KB4JZ
                    mapping = {
                        "14-3-3_beta": ["YWHAB"],
                        "14-3-3_epsilon": ["YWHAE"],
                        "14-3-3_zeta": ["YWHAZ"],
                        "4E-BP1": ["EIF4EBP1"],
                        "4E-BP1_pT37_T46": ["EIF4EBP1"],
                        "4E-BP1_pS65": ["EIF4EBP1"],
                        "53BP1": ["TP53BP1"],
                        "ACC_pS79": ["ACACA", "ACACB"],
                        "ACC1": ["ACACA"],
                        "ACVRL1": ["ACVRL1"],
                        "Akt": ["AKT1", "AKT2", "AKT3"],
                        "Akt_pS473": ["AKT1", "AKT2", "AKT3"],
                        "Akt_pT308": ["AKT1", "AKT2", "AKT3"],
                        "AMPK_alpha": ["PRKAA1"],
                        "AMPK_pT172": ["PRKAA1"],
                        "Annexin_I": ["ANXA1"],
                        "Annexin_VII": ["ANXA7"],
                        "AR": ["AR"],
                        "Bad_pS112": ["BAD"],
                        "Bak": ["BAK1"],
                        "Bax": ["BAX"],
                        "Bcl-2": ["BCL2"],
                        "Bcl-xL": ["BCL2L1"],
                        "Beclin": ["BECN1"],
                        "Bid": ["BID"],
                        "Bim": ["BCL2L11"],
                        "E-Cadherin": ["CDH1"],
                        "N-Cadherin": ["CDH2"],
                        "Caspase-7_cleavedD198": ["CASP7"],
                        "Caspase-9_cleavedD330": ["CASP9"],
                        "alpha-Catenin": ["CTNNA1"],
                        "beta-Catenin": ["CTNNB1"],
                        "Caveolin-1": ["CAV1"],
                        "CD31": ["PECAM1"],
                        "CD49b": ["ITGA2"],
                        "CDK1": ["CDC2"],
                        "Chk1": ["CHEK1"],
                        "Chk1_pS345": ["CHEK1"],
                        "Chk2": ["CHEK2"],
                        "Chk2_pT68": ["CHEK2"],
                        "cIAP": ["BIRC2"],
                        "Claudin-7": ["CLDN7"],
                        "Collagen_VI": ["COL6A1"],
                        "Cyclin_B1": ["CCNB1"],
                        "Cyclin_D1": ["CCND1"],
                        "Cyclin_E1": ["CCNE1"],
                        "DJ-1": ["PARK7"],
                        "Dvl3": ["DVL3"],
                        "eEF2": ["EEF2"],
                        "eEF2K": ["EEF2K"],
                        "EGFR": ["EGFR"],
                        "EGFR_pY1068": ["EGFR"],
                        "EGFR_pY1173": ["EGFR"],
                        "eIF4E": ["EIF4E"],
                        "eIF4G": ["EIF4G1"],
                        "ER-alpha": ["ESR1"],
                        "ER-alpha_pS118": ["ESR1"],
                        "ERCC1": ["ERCC1"],
                        "Fibronectin": ["FN1"],
                        "FOX03a": ["FOXO3"],
                        "FoxM1": ["FOXM1"],
                        "Gab2": ["GAB2"],
                        "GATA3": ["GATA3"],
                        "GSK3_pS9": ["GSK3A", "GSK3B"],
                        "GSK3-alpha-beta": ["GSK3A", "GSK3B"],
                        "GSK3-alpha-beta_pS21_S9": ["GSK3A", "GSK3B"],
                        "TSC1": ["TSC1"],
                        "HER2": ["ERBB2"],
                        "HER2_pY1248": ["ERBB2"],
                        "HER3": ["ERBB3"],
                        "HER3_pY1298": ["ERBB3"],
                        "IGFBP2": ["IGFBP2"],
                        "INPP4B": ["INPP4B"],
                        "IRS1": ["IRS1"],
                        "JNK_pT183_pT185": ["MAPK8"],
                        "JNK2": ["MAPK9"],
                        "c-Kit": ["KIT"],
                        "Lck": ["LCK"],
                        "MAPK_pT202_Y204": ["MAPK1", "MAPK3"],
                        "MEK1": ["MAP2K1"],
                        "MEK1_pS217_S221": ["MAP2K1"],
                        "c-Met": ["MET"],
                        "c-Met_pY1235": ["MET"],
                        "MGMT": ["MGMT"],
                        "MIG-6": ["ERRFI1"],
                        "MSH2": ["MSH2"],
                        "MSH6": ["MSH6"],
                        "mTOR": ["FRAP1"],
                        "mTOR_pS2448": ["FRAP1"],
                        "c-Myc": ["MYC"],
                        "MYH11": ["MYH11"],
                        "NDRG1_pT346": ["NDRG1"],
                        "NF2": ["NF2"],
                        "NF-kB-p65_pS536": ["NFKB1"],
                        "Notch1": ["NOTCH1"],
                        "Notch3": ["NOTCH3"],
                        "p27": ["CDKN1B"],
                        "p27_pT157": ["CDKN1B"],
                        "p27_pT198": ["CDKN1B"],
                        "p38_MAPK": ["MAPK14"],
                        "p38_pT180_Y182": ["MAPK14"],
                        "p53": ["TP53"],
                        "p70S6K": ["RPS6KB1"],
                        "p70S6K_pT389": ["RPS6KB1"],
                        "p90RSK_pT359_S363": ["RPS6KA1"],
                        "Paxillin": ["PXN"],
                        "PCNA": ["PCNA"],
                        "PDCD4": ["PDCD4"],
                        "PDK1": ["PDK1"],
                        "PDK1_pS241": ["PDK1"],
                        "PEA15": ["PEA15"],
                        "PEA15_pS116": ["PEA15"],
                        "PI3K-p110-alpha": ["PIK3CA"],
                        "PI3K-p85": ["PIK3R1"],
                        "PKC-alpha": ["PRKCA"],
                        "PKC-alpha_pS657": ["PRKCA"],
                        "PKC-delta_pS664": ["PRKCD"],
                        "PKC-pan_BetaII_pS660": ["PKC"],
                        "PR": ["PGR"],
                        "PRAS40_pT246": ["AKT1S1"],
                        "PTEN": ["PTEN"],
                        "Rab11": ["RAB11A", "RAB11B"],
                        "Rab25": ["RAB25"],
                        "Rad50": ["RAD50"],
                        "Rad51": ["RAD51"],
                        "Raf-B": ["BRAF"],
                        "C-Raf": ["RAF1"],
                        "C-Raf_pS338": ["RAF1"],
                        "Raptor": ["RPTOR"],
                        "K-Ras": ["KRAS"],
                        "N-Ras": ["NRAS"],
                        "Rb": ["RB1"],
                        "Rb_pS807_S811": ["RB1"],
                        "RBM15": ["RBM15"],
                        "Rictor": ["RICTOR"],
                        "Rictor_pT1135": ["RICTOR"],
                        "S6_pS235_S236": ["RPS6"],
                        "S6_pS240_S244": ["RPS6"],
                        "SCD1": ["SCD1"],
                        "SF2": ["SFRS1"],
                        "Smac": ["DIABLO"],
                        "Smad1": ["SMAD1"],
                        "Smad3": ["SMAD3"],
                        "Smad4": ["SMAD4"],
                        "Snail": ["SNAI2"],
                        "Src": ["SRC"],
                        "Src_pY416": ["SRC"],
                        "Src_pY527": ["SRC"],
                        "STAT3_pY705": ["STAT3"],
                        "STAT5-alpha": ["STAT5A"],
                        "Stathmin": ["STMN1"],
                        "Syk": ["SYK"],
                        "TAZ": ["WWTR1"],
                        "TAZ_pS89": ["WWTR1"],
                        "TTF1": ["TTF1"],
                        "TIGAR": ["C12ORF5"],
                        "TRFC": ["TRFC"],
                        "Transglutaminase": ["TGM2"],
                        "Tuberin": ["TSC2"],
                        "VEGFR2": ["KDR"],
                        "VHL": ["VHL"],
                        "XRCC1": ["XRCC1"],
                        "YAP": ["YAP1"],
                        "YAP_pS127": ["YAP1"],
                        "YB-1": ["YBX1"],
                        "YB-1_pS102": ["YBX1"]
                    };
                    if (mapping.hasOwnProperty(antibody)) {
                        return mapping[antibody];
                    } else {
                        return [];
                    }
                }
            };
        });

        app.controller("template", function ($scope, $templateCache) {
            $templateCache.put("download-data.html", '<div ng-controller="download"><progress-bar message="message" percentage="percentage" /></div>');
            $templateCache.put("main.html", '<div ng-controller="main"><div class="accordion"><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-samples">Samples</a></div><div id="rppa-samples" class="accordion-body collapse"><div ng-controller="samples" class="accordion-inner"><p>Select samples to include in the analysis.</p><div class="btn-group rppa-btn-group"><button ng-click="selectAll(samples)" class="btn btn-mini">Select all</button><button ng-click="selectNone(samples)" class="btn btn-mini">Select none</button></div><table class="table table-striped"><thead><tr><th></th><th ng-class="getSortClass(\'id\')" ng-click="changeSortColumn(\'id\')">UUID</th><th ng-class="getSortClass(\'race\')" ng-click="changeSortColumn(\'race\')">Race</th><th ng-class="getSortClass(\'gender\')" ng-click="changeSortColumn(\'gender\')">Gender</th><th ng-class="getSortClass(\'age\')" ng-click="changeSortColumn(\'age\')">Age</th><th ng-class="getSortClass(\'vitalStatus\')" ng-click="changeSortColumn(\'vitalStatus\')">Vital Status</th></thead><tbody><tr ng-repeat="sample in samples | orderBy:sortColumn:reverseSort"><td><input type="checkbox" ng-model="sample.selected" /></td><td><a href="{{sample.uri}}" target="_blank">{{sample.id}}</a></td><td>{{sample.race}}</td><td>{{sample.gender}}</td><td>{{sample.age}}</td><td>{{sample.vitalStatus}}</td></tbody></table></div></div></div><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-antibodies">Antibodies</a></div><div id="rppa-antibodies" class="accordion-body collapse"><div ng-controller="antibodies" class="accordion-inner"><p>Select antibodies to include in the analysis.</p><div class="btn-group rppa-btn-group"><button ng-click="selectAll(antibodies)" class="btn btn-mini">Select all</button><button ng-click="selectNone(antibodies)" class="btn btn-mini">Select none</button></div><table class="table table-striped"><thead><tr><th></th><th ng-class="getSortClass(\'name\')" ng-click="changeSortColumn(\'name\')">Antibody</th><th ng-class="getSortClass(\'genes\')" ng-click="changeSortColumn(\'genes\')">Related Genes</th></thead><tbody><tr ng-repeat="antibody in antibodies | orderBy:sortColumn:reverseSort"><td><input type="checkbox" ng-model="antibody.selected" /></td><td>{{antibody.name}}</td><td>{{antibody.genes}}</td></tbody></table></div></div></div><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-summary">Summary</a></div><div id="rppa-summary" class="accordion-body collapse"><div ng-controller="summary" class="accordion-inner"><table class="table table-striped"><thead><tr><th ng-class="getSortClass(\'antibody\')" ng-click="changeSortColumn(\'antibody\')">Antibody</th><th ng-class="getSortClass(\'median\')" ng-click="changeSortColumn(\'median\')">Median</th><th ng-class="getSortClass(\'mean\')" ng-click="changeSortColumn(\'mean\')">Mean</th><th ng-class="getSortClass(\'standardDeviation\')" ng-click="changeSortColumn(\'standardDeviation\')">Standard deviation</th><th>Slide</th></tr></thead><tbody><tr ng-repeat="item in summary | orderBy:sortColumn:reverseSort"><td>{{item.antibody}}</td><td>{{item.median}}</td><td>{{item.mean}}</td><td>{{item.standardDeviation}}</td><td><a href="{{item.slide}}" target="_blank">Slide</a></td></tr></tbody></table></div></div></div><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-correlations">Correlation coefficients of antibody pairs</a></div><div id="rppa-correlations" class="accordion-body collapse"><div class="accordion-inner"><heatmap data="correlations" /></div></div></div><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-clusters">Clustering of correlation coefficients</a></div><div id="rppa-clusters" class="accordion-body collapse"><div class="accordion-inner"><dendrogram labels="clusterLabels" data="clusters" /></div></div></div><div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-target="#rppa-export">Export tidied data (for use in R, MATLAB, Google Refine, ...)</a></div><div id="rppa-export" class="accordion-body collapse"><div class="accordion-inner"><p>Format: <code>Sample REF</code> \\t <code>Composite Element REF</code> \\t <code>Protein</code> \\t <code>Protein Expression</code></p><a href="{{blobUri}}" download="rppa.tsv" class="btn">Download tidied data</a></div></div></div></div><div>');
            $scope.template = "download-data.html";
            $scope.$on("updateTemplate", function (event, template) {
                $scope.template = template;
            });
        });

        app.controller("download", function ($scope, $q, rppa, store) {
            $scope.message = "Querying TCGA Roadmap... (please be patient)";
            $scope.percentage = 1;
            rppa.fetchLinks().then(function (links) {
                $scope.message = "Downloading files straight from TCGA... (please be patient)";
                rppa.fetchFiles(links).then(function (files) {
                    var promises;
                 // Now that q supports progress notifications, AngularJS will hopefully implement them, too.
                 // https://github.com/kriskowal/q/issues/63
                    $scope.percentage = 100;
                 // Store each file in the store service.
                    promises = files.map(function (file, idx) {
                        var id;
                        id = rppa.extractSampleId(links[idx]);
                        return store.set("file:" + id, file);
                    });
                 // Store links in the store service.
                    promises.push(store.set("links", links));
                 // Parse one file to extract a list of antibodies.
                    promises.push(rppa.normalizeFile(files[0]).then(function (observations) {
                        var antibodies;
                        antibodies = observations.map(function (observation) {
                            return observation[2];
                        });
                     // Store antibodies in store service.
                        return store.set("antibodies", antibodies);
                    }));
                 // Get patient data.
                    promises.push(rppa.mapUuidsToBarcodes(links.map(function (link) {
                        return rppa.extractSampleId(link);
                    })).then(function (mappings) {
                        return rppa.fetchPatientInformation(mappings.map(function (mapping) {
                         // Extract patient ID.
                            return mapping.barcode.substring(0, 12);
                        }));
                    }).then(function (patients) {
                        return store.set("patients", patients);
                    }));
                 // Get links to slides.
                    promises.push(rppa.fetchSlides().then(function (slides) {
                        return store.set("slides", slides);
                    }));
                    $q.all(promises).then(function () {
                     // Change template.
                        $scope.$emit("updateTemplate", "main.html");
                    });
                });
            });
        });

        app.controller("main", function ($scope, $q, $window, rppa, store) {
         // Retrieve all the data needed from the store.
            $q.all([store.get("links"), store.get("patients"), store.get("antibodies"), store.get("slides")]).then(function (values) {
                var links, patients, antibodies, slides;
                links = values[0];
                patients = values[1];
                antibodies = values[2];
                slides = values[3];
                return rppa.mapUuidsToBarcodes(links.map(function (link) {
                    return rppa.extractSampleId(link);
                })).then(function (barcodes) {
                 // Preselect links.
                    links = links.map(function (link) {
                        var sampleId, patientId, patient;
                        sampleId = rppa.extractSampleId(link);
                        patientId = barcodes.filter(function (element) {
                            return element.uuid === sampleId;
                        })[0].barcode.substring(0, 12);
                        patient = patients.filter(function (element) {
                            return element.bcr_patient_barcode === patientId;
                        })[0];
                        return {
                            id: sampleId,
                            uri: link,
                            gender: patient !== undefined ? patient.gender : "[Not Available]",
                            race: patient !== undefined ? patient.race : "[Not Available]",
                            age: patient !== undefined ? patient.age_at_initial_pathologic_diagnosis : "[Not Available]",
                            vitalStatus: patient !== undefined ? patient.vital_status : "[Not Available]",
                            selected: true
                        };
                    });
                    return links;
                }).then(function (samples) {
                    $scope.samples = samples;
                    $scope.antibodies = antibodies.map(function (antibody) {
                        var genes;
                        genes = rppa.mapAntibodyToGenes(antibody);
                        return {
                            name: antibody,
                            genes: genes.length > 0 ? genes.join(", ") : "[Not Available]",
                         // Preselect antibodies.
                            selected: true
                        };
                    });
                    $scope.slides = slides;
                    $scope.$emit("preloadedData");
                });
            });
            $scope.selectAll = function (model) {
                model.forEach(function (item) {
                    item.selected = true;
                });
            };
            $scope.selectNone = function (model) {
                model.forEach(function (item) {
                    item.selected = false;
                });
            };
            $scope.$on("preloadedData", function (event) {
             // Register watcher after data has been loaded.
                $scope.$watch(function () {
                    return {
                        samples: $scope.samples,
                        antibodies: $scope.antibodies,
                        slides: $scope.slides
                    };
                }, function (combination) {
                    var samples, ignoredAntibodies, promises;
                    samples = combination.samples.filter(function (sample) {
                        return sample.selected;
                    });
                    ignoredAntibodies = combination.antibodies.filter(function (antibody) {
                        return !antibody.selected;
                    }).map(function (antibody) {
                        return antibody.name;
                    });
                    promises = samples.map(function (sample) {
                        return store.get("file:" + sample.id).then(function (file) {
                            return rppa.normalizeFile(file, ignoredAntibodies);
                        });
                    });
                    $q.all(promises).then(function (data) {
                        var blob, groupedByAntibody, antibodyNames, standardizedAntibodies, correlations, i, j, correlation, pairwiseDistances;
                     // Flatten data.
                        if (data.length > 0) {
                            data = data.reduce(function (previous, current) {
                                return previous.concat(current);
                            });
                        }
                     // Generate blob URI.
                        blob = new Blob([
                            "Sample REF\tComposite Element REF\tProtein\tProtein Expression\n",
                            data.map(function (observation) {
                                return observation.join("\t");
                            }).join("\n")
                        ]);
                     // See http://www.html5rocks.com/en/tutorials/workers/basics/#toc-inlineworkers-bloburis
                        $scope.blobUri = $window.URL.createObjectURL(blob);
                     // Group observations by antibody.
                        groupedByAntibody = {};
                        data.forEach(function (observation) {
                            var antibody, expression;
                            antibody = observation[2];
                            expression = observation[3];
                            if (groupedByAntibody.hasOwnProperty(antibody) === false) {
                                groupedByAntibody[antibody] = [];
                            }
                            groupedByAntibody[antibody].push(expression);
                        });
                     // Extract antibody names for fast lookup.
                        antibodyNames = Object.keys(groupedByAntibody);
                     // Compute summary statistics.
                        $scope.summary = antibodyNames.map(function (antibody) {
                            return {
                                antibody: antibody,
                                median: $window.spearson.median(groupedByAntibody[antibody]),
                                mean: $window.spearson.mean(groupedByAntibody[antibody]),
                                standardDeviation: $window.spearson.standardDeviation(groupedByAntibody[antibody]),
                                slide: combination.slides.filter(function (element) {
                                    return element.name === antibody;
                                })[0].uri
                            };
                        });
                     // Standardize expression values.
                        standardizedAntibodies = {};
                        antibodyNames.map(function (antibody) {
                            standardizedAntibodies[antibody] = $window.spearson.standardize(groupedByAntibody[antibody]);
                        });
                     // Calculate the correlation coefficients of all antibody expression levels.
                        correlations = {};
                        for (i = 0; i < antibodyNames.length; i++) {
                            correlations[antibodyNames[i]] = {};
                            for (j = 0; j <= i; j++) {
                                if (i === j) {
                                    correlations[antibodyNames[i]][antibodyNames[j]] = 1;
                                } else {
                                    correlation = $window.spearson.correlation.pearson(standardizedAntibodies[antibodyNames[i]], standardizedAntibodies[antibodyNames[j]], false);
                                    correlations[antibodyNames[i]][antibodyNames[j]] = correlation;
                                    correlations[antibodyNames[j]][antibodyNames[i]] = correlation;
                                }
                            }
                        }
                        $scope.correlations = correlations;
                     // Calculate the pairwise distances.
                        pairwiseDistances = Object.keys(correlations).map(function (proteinA) {
                            return Object.keys(correlations[proteinA]).map(function (proteinB) {
                             // The direction of the correlation coefficient is of no value,
                             // it is only the magnitude that matters.
                                return 1 - Math.abs(correlations[proteinA][proteinB]);
                            });
                        });
                     // Run the clustering.
                        $scope.clusters = $window.spearson.hierarchicalClustering(pairwiseDistances, "upgma");
                        $scope.clusterLabels = antibodyNames;
                    });
                }, true);
            });
        });

        app.controller("samples", function ($scope) {
            $scope.sortColumn = "uuid";
            $scope.reverseSort = false;
            $scope.changeSortColumn = function (column) {
                if (column !== $scope.sortColumn) {
                    $scope.reverseSort = false;
                } else {
                    $scope.reverseSort = !$scope.reverseSort;
                }
                $scope.sortColumn = column;
            };
            $scope.getSortClass = function (column) {
                if (column === $scope.sortColumn) {
                    if ($scope.reverseSort === false) {
                        return "sort-desc";
                    } else {
                        return "sort-asc";
                    }
                } else {
                    return "sort";
                }
            };
        });

        app.controller("antibodies", function ($scope) {
            $scope.sortColumn = "antibody";
            $scope.reverseSort = false;
            $scope.changeSortColumn = function (column) {
                if (column !== $scope.sortColumn) {
                    $scope.reverseSort = false;
                } else {
                    $scope.reverseSort = !$scope.reverseSort;
                }
                $scope.sortColumn = column;
            };
            $scope.getSortClass = function (column) {
                if (column === $scope.sortColumn) {
                    if ($scope.reverseSort === false) {
                        return "sort-desc";
                    } else {
                        return "sort-asc";
                    }
                } else {
                    return "sort";
                }
            };
        });

        app.controller("summary", function ($scope) {
            $scope.sortColumn = "antibody";
            $scope.reverseSort = false;
            $scope.changeSortColumn = function (column) {
                if (column !== $scope.sortColumn) {
                    $scope.reverseSort = false;
                } else {
                    $scope.reverseSort = !$scope.reverseSort;
                }
                $scope.sortColumn = column;
            };
            $scope.getSortClass = function (column) {
                if (column === $scope.sortColumn) {
                    if ($scope.reverseSort === false) {
                        return "sort-desc";
                    } else {
                        return "sort-asc";
                    }
                } else {
                    return "sort";
                }
            };
        });

        app.directive("progressBar", function ($window) {
            return {
                restrict: "E",
                scope: {
                    message: "=",
                    percentage: "="
                },
                template: '<div class="well"><p>{{message}}</p><div class="progress progress-striped active"><div class="bar" style="width: {{percentage}}%"></div></div></div>'
            };
        });

        app.directive("heatmap", function ($window) {
            return {
                restrict: "E",
                scope: {
                    data: "="
                },
                link: function (scope, element, attrs) {
                    var viz;
                    viz = $window.heatmap().width(908).height(908);
                    scope.$watch("data", function (data) {
                        data = data || [];
                        $window.d3.select(element[0])
                                  .datum(data)
                                  .call(viz);
                    });
                }
            };
        });

        app.directive("dendrogram", function ($window) {
            return {
                restrict: "E",
                scope: {
                    labels: "=",
                    data: "="
                },
                link: function (scope, element, attrs) {
                    var viz;
                    viz = $window.dendrogram().width(908).height(4000);
                    scope.$watch("data", function (data) {
                        data = data || [];
                        viz.labels(scope.labels);
                        $window.d3.select(element[0])
                                  .datum(data)
                                  .call(viz);
                    });
                }
            };
        });

     // Register tab.
        TCGA.ui.registerTab({
            id: "rppa",
            title: "RPPA",
            content: '<style>.rppa-btn-group {margin-bottom: 5px} .node circle {fill: #fff; stroke: steelblue; stroke-width: 1.5px} .node {font: 10px sans-serif} .link {fill: none; stroke: #ccc; stroke-width: 1.5px}</style><div class="page-header"><h1>RPPA <small>Real time analysis of reverse phase protein array data.</small></h1><p>Author: <a href="mailto:gruene@uab.edu">Alexander Grüneberg</a></p></div><p class="lead"><a href="http://www.mdanderson.org/education-and-research/resources-for-professionals/scientific-resources/core-facilities-and-services/functional-proteomics-rppa-core/index.html" target="_blank">Reverse phase protein array (RPPA)</a> is a high-throughput antibody-based technique to evaluate protein activities in signaling networks.</p><p style="margin-bottom: 15px;"><span class="label label-info">Info</span> At the moment, the only supported cancer type is <strong>glioblastoma multiforme (GBM)</strong>.</p><div ng-controller="template"><ng-include src="template" /></div>',
            switchTab: true
        }, function (err, el) {
            angular.bootstrap(el, ["app"]);
        });

    });

}());
