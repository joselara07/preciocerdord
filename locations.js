/*
=========================================================
 PRECIO CERDO RD
 DIVISIÓN TERRITORIAL DE REPÚBLICA DOMINICANA

 Estructura:

 Provincia
    ↓
 Municipio
    ↓
 Distrito municipal

 La relación de los distritos se realiza mediante
 municipioId.
=========================================================
*/


const locations = {};


// =======================================================
// FUENTES
// =======================================================

const TERRITORY_SOURCES = {

    provinces:
        "https://raw.githubusercontent.com/DannyFeliz/Datos-Rep-Dom/master/JSON/provincias.json",

    municipalities:
        "https://raw.githubusercontent.com/DannyFeliz/Datos-Rep-Dom/master/JSON/municipios.json",

    districts:
        "https://raw.githubusercontent.com/DannyFeliz/Datos-Rep-Dom/master/JSON/distritos.json"

};


// =======================================================
// LIMPIAR NOMBRES
// =======================================================

function cleanTerritoryName(name) {

    if (!name) {
        return "";
    }

    return name

        .replace(/\s*\(DM\)\s*$/i, "")

        .replace(/\s+/g, " ")

        .trim();

}


// =======================================================
// NORMALIZAR PROVINCIAS
// =======================================================

function normalizeProvinceName(name) {

    const cleaned =
        cleanTerritoryName(name);


    const corrections = {

        "Sanchez Ramírez":
            "Sánchez Ramírez",

        "Sanchez Ramirez":
            "Sánchez Ramírez"

    };


    return (
        corrections[cleaned]
        || cleaned
    );

}


// =======================================================
// CARGAR DIVISIÓN TERRITORIAL
// =======================================================

async function loadLocations() {

    try {

        console.log(
            "🌎 Cargando división territorial..."
        );


        const [

            provincesResponse,

            municipalitiesResponse,

            districtsResponse

        ] = await Promise.all([

            fetch(
                TERRITORY_SOURCES.provinces
            ),

            fetch(
                TERRITORY_SOURCES.municipalities
            ),

            fetch(
                TERRITORY_SOURCES.districts
            )

        ]);


        if (

            !provincesResponse.ok ||
            !municipalitiesResponse.ok ||
            !districtsResponse.ok

        ) {

            throw new Error(
                "No se pudieron descargar los datos territoriales."
            );

        }


        const [

            provinces,

            municipalities,

            districts

        ] = await Promise.all([

            provincesResponse.json(),

            municipalitiesResponse.json(),

            districtsResponse.json()

        ]);


        // =================================================
        // PROVINCIAS
        // =================================================

        provinces.forEach(
            function(province) {

                const provinceName =
                    normalizeProvinceName(
                        province.nombre
                    );


                locations[provinceName] = {};

            }
        );


        // =================================================
        // MUNICIPIOS
        //
        // IMPORTANTE:
        //
        // municipios.json NO trae "id".
        //
        // El ID corresponde a la posición
        // consecutiva del municipio.
        //
        // Por eso:
        //
        // index 0 → ID 1
        // index 1 → ID 2
        // index 2 → ID 3
        //
        // Esto permite relacionarlo con
        // distrito.municipioId.
        // =================================================

        municipalities.forEach(
            function(municipality, index) {

                const municipalityId =
                    index + 1;


                const province =
                    provinces.find(
                        function(item) {

                            return (
                                item.id ===
                                municipality.provinciaId
                            );

                        }
                    );


                if (!province) {

                    console.warn(
                        "⚠️ Provincia no encontrada para municipio:",
                        municipality.nombre
                    );

                    return;

                }


                const provinceName =
                    normalizeProvinceName(
                        province.nombre
                    );


                const municipalityName =
                    cleanTerritoryName(
                        municipality.nombre
                    );


                if (
                    !locations[provinceName]
                ) {

                    locations[provinceName] = {};

                }


                locations[provinceName]
                    [municipalityName] = {

                        id:
                            municipalityId,

                        districts: []

                    };

            }
        );


        // =================================================
        // DISTRITOS MUNICIPALES
        // =================================================

        let districtsAdded = 0;


        districts.forEach(
            function(district) {

                const municipality =
                    municipalities[
                        district.municipioId - 1
                    ];


                if (!municipality) {

                    console.warn(
                        "⚠️ Municipio no encontrado para distrito:",
                        district.nombre,
                        "municipioId:",
                        district.municipioId
                    );

                    return;

                }


                const province =
                    provinces.find(
                        function(item) {

                            return (
                                item.id ===
                                municipality.provinciaId
                            );

                        }
                    );


                if (!province) {

                    return;

                }


                const provinceName =
                    normalizeProvinceName(
                        province.nombre
                    );


                const municipalityName =
                    cleanTerritoryName(
                        municipality.nombre
                    );


                const districtName =
                    cleanTerritoryName(
                        district.nombre
                    );


                const municipalityData =
                    locations
                        [provinceName]
                        ?.[
                            municipalityName
                        ];


                if (!municipalityData) {

                    console.warn(
                        "⚠️ No se encontró estructura para:",
                        provinceName,
                        municipalityName
                    );

                    return;

                }


                municipalityData
                    .districts
                    .push(
                        districtName
                    );


                districtsAdded++;

            }
        );


        // =================================================
        // ORDENAR MUNICIPIOS Y DISTRITOS
        // =================================================

        Object.keys(locations)
            .forEach(
                function(provinceName) {

                    const provinceData =
                        locations[
                            provinceName
                        ];


                    const sortedMunicipalities =
                        {};


                    Object.keys(
                        provinceData
                    )
                    .sort(
                        function(a, b) {

                            return a.localeCompare(
                                b,
                                "es"
                            );

                        }
                    )
                    .forEach(
                        function(municipalityName) {

                            const municipalityData =
                                provinceData[
                                    municipalityName
                                ];


                            municipalityData
                                .districts
                                .sort(
                                    function(a, b) {

                                        return a.localeCompare(
                                            b,
                                            "es"
                                        );

                                    }
                                );


                            sortedMunicipalities[
                                municipalityName
                            ] =
                                municipalityData;

                        }
                    );


                    locations[
                        provinceName
                    ] =
                        sortedMunicipalities;

                }
            );


        // =================================================
        // RESULTADO
        // =================================================

        window.locationsReady =
            true;


        console.log(
            "✅ División territorial cargada correctamente."
        );


        console.log(
            "📍 Provincias:",
            Object.keys(locations).length
        );


        console.log(
            "🏘️ Municipios:",
            municipalities.length
        );


        console.log(
            "🗺️ Distritos municipales cargados:",
            districtsAdded
        );


        // Avisar a la aplicación
        document.dispatchEvent(
            new Event(
                "locationsReady"
            )
        );


    } catch (error) {

        console.error(
            "❌ Error cargando división territorial:",
            error
        );


        window.locationsReady =
            false;


        alert(
            "No se pudo cargar la división territorial."
        );

    }

}


// =======================================================
// INICIAR
// =======================================================

loadLocations();
