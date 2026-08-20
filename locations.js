/*
=========================================================
 PRECIO CERDO RD
 Estructura territorial:
 Provincia → Municipio → Distrito municipal

 Fuente territorial:
 División Territorial de la ONE / Datos-Rep-Dom
=========================================================
*/


const locations = {};


// =======================================================
// FUENTES DE DATOS TERRITORIALES
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
// NORMALIZAR NOMBRES
// =======================================================

function cleanTerritoryName(name) {

    if (!name) {
        return "";
    }


    return name

        // Eliminar indicador de distrito municipal
        .replace(/\s*\(DM\)\s*$/i, "")

        // Espacios repetidos
        .replace(/\s+/g, " ")

        // Espacios al inicio/final
        .trim();

}


// =======================================================
// CORRECCIONES DE NOMBRES
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


    return corrections[cleaned]
        || cleaned;

}


// =======================================================
// CARGAR ESTRUCTURA TERRITORIAL
// =======================================================

async function loadLocations() {

    try {

        console.log(
            "Cargando división territorial..."
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
                "No se pudieron cargar los datos territoriales."
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
        // 1. CREAR PROVINCIAS
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
        // 2. CREAR MUNICIPIOS
        // =================================================

        municipalities.forEach(
            function(municipality) {

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
                        "Provincia no encontrada para municipio:",
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
                    [municipalityName] = [];

            }
        );


        // =================================================
        // 3. AGREGAR DISTRITOS MUNICIPALES
        // =================================================

        districts.forEach(
            function(district) {

                const municipality =
                    municipalities.find(
                        function(item) {

                            return (
                                item.id ===
                                district.municipioId
                            );

                        }
                    );


                if (!municipality) {

                    console.warn(
                        "Municipio no encontrado para distrito:",
                        district.nombre
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


                if (

                    locations[provinceName] &&
                    locations[provinceName]
                        [municipalityName]

                ) {

                    locations[provinceName]
                        [municipalityName]
                        .push(
                            districtName
                        );

                }

            }
        );


        // =================================================
        // 4. ORDENAR ALFABÉTICAMENTE
        // =================================================

        Object.keys(locations)
            .forEach(
                function(provinceName) {

                    const municipalitiesData =
                        locations[provinceName];


                    const sortedMunicipalities =
                        {};


                    Object.keys(
                        municipalitiesData
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

                            sortedMunicipalities[
                                municipalityName
                            ] =
                                municipalitiesData[
                                    municipalityName
                                ]
                                .sort(
                                    function(a, b) {

                                        return a.localeCompare(
                                            b,
                                            "es"
                                        );

                                    }
                                );

                        }
                    );


                    locations[provinceName] =
                        sortedMunicipalities;

                }
            );


        console.log(
            "División territorial cargada correctamente."
        );


        console.log(
            "Provincias:",
            Object.keys(locations).length
        );


        // Avisar al resto de la aplicación
        document.dispatchEvent(
            new Event(
                "locationsReady"
            )
        );


    } catch (error) {

        console.error(
            "Error cargando división territorial:",
            error
        );


        alert(
            "No se pudo cargar la división territorial. Revisa tu conexión a Internet."
        );

    }

}


// =======================================================
// INICIAR CARGA
// =======================================================

loadLocations();
