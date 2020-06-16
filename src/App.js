import React, {useState, useEffect} from "react";
import {Map, Marker, Popup, TileLayer} from "react-leaflet";
import {Icon} from "leaflet";
import useSwr from "swr";
import "./App.css";
import * as csv from "csvtojson";

const request = require("request");

const fetcher = (...args) => fetch(...args).then((response) => response.json());

const icon = new Icon({
    iconUrl: "/monument.svg",
    iconSize: [25, 25],
});

const csvDataHandler = async (url) => {
    const dataset = request.get(url);
    return csv({noheader: false, headers: ["id", "name"]})
        .fromStream(dataset)
        .then((response) => response)
        .error((err) => console.log(err));
};

export default function App() {
    let monuments;
    const [csvLines, setCsvLines] = useState(null);
    //useEffect
    useEffect(() => {
        const csv =
            "http://cswcl.github.io/fake-api/monumentos_historicos_extracto.csv";
        if (!csvLines) {
            csvDataHandler(csv).then((response) => {
                if (response !== csvLines) {
                    setCsvLines(response);
                }
            });
        }
    }, [csvLines]); //Pass Array as second argument

    const url =
        "https://cswcl.github.io/fake-api/monumentos_historicos_extracto.geojson";
    const {data, error} = useSwr(url, fetcher);
    if (data && data.features && data.features.length > 0)
        data.features.forEach((m) => {
            if (!m.geometry.coordinates.length) return;
            const coordinatesCopy = {...m.geometry.coordinates};
            delete m.geometry.coordinates;
            const coordinates = {
                latitude: coordinatesCopy[1],
                longitude: coordinatesCopy[0],
            };
            Object.assign(m.geometry, {coordinates: coordinates});
            //console.log(m)
        });

    monuments =
        data && data.features && data.features.length > 0 && !error
            ? data.features.slice(0, 100)
            : [];
    if (monuments && monuments.length > 0 && csvLines) {
        // console.log(csvLines)
        monuments.forEach(e => {
            e.properties.name = csvLines.find(element => e.properties.id === parseInt(element.id)).name;
        });

    }
    // console.log(monuments)
    const [monument, setMonument] = React.useState(null);

    // latitude: -70.651292865
    // longitude: -33.437933957
    // http://cswcl.github.io/fake-api/monumentos_historicos_extracto.csv
    return (
        <Map center={[-33.437933957, -70.651292865]} zoom={17}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />

            {monuments.map((m) => (
                <Marker
                    key={m.properties.id}
                    position={[
                        m.geometry.coordinates.latitude,
                        m.geometry.coordinates.longitude,
                    ]}
                    icon={icon}
                    onClick={() => {
                        setMonument(m);
                    }}
                />
            ))}

            {monument && (
                <Popup
                    position={[
                        monument.geometry.coordinates.latitude,
                        monument.geometry.coordinates.longitude,
                    ]}
                    onClose={() => {
                        setMonument(null);
                    }}
                >
                    <div>
                        <h2>{monument.properties.name}</h2>
                    </div>
                </Popup>
            )}
        </Map>
    );
}
