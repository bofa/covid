import * as React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { smooth } from './Chart';
import axios from 'axios';

// url to a valid topojson file
const geoUrl = 'https://raw.githubusercontent.com/zcreativelabs/react-simple-maps/master/topojson-maps/world-110m.json';

let geoLoad = [] as any;
axios.get(geoUrl)
    .then(reponse => reponse.data)
    .then(data => geoLoad = data);

export const transformNames = {
    'United States of America': 'US',
    'South Korea': 'Korea South',
};

function tranformName(label: string) {
    const transform = transformNames[label];

    if (transform) {
        return transform;
    }

    return label;
}

interface MapsProps {
    width: number;
    height: number;
    series: Series[];
    smooth: number;
}

export function Map(props: MapsProps) {
    const regionsInMap = geoLoad.objects.ne_110m_admin_0_countries.geometries
        .map((g: any) => g.properties.NAME)
        .map(tranformName) as string[];

    const smoothedSeries = props.series
        .filter(s => regionsInMap.includes(s.label))
        .map(s => ({ label: s.label, data: smooth(s.data, props.smooth) }));

    const values = smoothedSeries.map(s => s.data[s.data.length - 2].y);
    const max = Math.max(...values) / 255;

    return (
        <div>
        <ComposableMap
            width={props.width}
            height={props.height}
            // projection="geoEckert4"
            projection="geoAzimuthalEqualArea"
            // projection="geoBromley"
            projectionConfig={{
                // rotate: [-20.0, -52.0, 0],
                scale: 200
            }}
        >
            <ZoomableGroup zoom={1}>
                <Geographies geography={geoLoad}>
                {({geographies}) => geographies.map((geo: { rsmKey: any, properties: { NAME: string }}) => {
                    const data = smoothedSeries
                        .find(s => s.label === tranformName(geo.properties.NAME))
                        ?.data;

                    const fill = data ? `rgb(${data[data.length - 1].y / max},0,0)` : 'gray';

                    return <Geography key={geo.rsmKey} geography={geo} fill={fill} />;
                })}
                </Geographies>
            </ZoomableGroup>
        </ComposableMap>
        </div>
    );
}
