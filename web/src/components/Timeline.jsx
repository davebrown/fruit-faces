import React from 'react';
import { Link } from 'react-router-dom';
import dateformat from 'dateformat';

class MonthContainer extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { images, className, monthLabel, showLabel, selectedImage } = this.props;

    return (
      <div className="flex-column month-thumb-table flex-fixed">
        <h6>{monthLabel}</h6>
        <div className={'flex-container flex-wrap thumb-table ' + (className || '')}>
          {
            images.map((image) => {
              const selClass = selectedImage === image ? 'thumb-selected': '';
              const label = showLabel ? (<span className="footnote">{image.base}</span>) : '';
              return (
                <Link key={'thumbtable-cell-' + image.id} to={'/images' + image.path} className="flex-column thumb-cell">
                  <img src={'/thumbs' + image.root + '/' + image.base + '_60x80_t.jpg'} className={selClass}/>
                  {label}
                </Link>
              );
            })
          }
        </div>
      </div>
      );
  }
  
}
export default class ThumbTable extends React.Component {

  constructor(props) {
    super(props);
  }

  sortByMonth(images) {
    var ret = {};
    for (var i = 0; i < images.length; i++) {
      var key = dateformat(images[i].timestamp, 'yyyy-mm');
      if (!ret[key]) {
        ret[key] = {};
        ret[key]['label'] = dateformat(images[i].timestamp, 'mmmm yyyy');
        ret[key]['images'] = [];
        //console.log((new Date(images[i].timestamp)) + ' --> ' + key + ' / ' + ret[key]['label']);
      }
      ret[key].images.push(images[i]);
    }
    return ret;
  }
  render() {
    const { images, className, showLabel, selectedImage } = this.props;
    const byMonth = this.sortByMonth(images);
    var monthKeys = Object.keys(byMonth);
    monthKeys.sort().reverse();
    return (
      <div className={'flex-column timeline-container ' + (className || '')}>
        {
          monthKeys.map((key) => {
            const month = byMonth[key];
            return (<MonthContainer monthLabel={month['label']} images={month['images']}
                      selectedImage={selectedImage}
                      key={'month-thumb-container-' + key} showLabel={showLabel}/>);
            return (<span key={'month-thumb-container-' + key}>{key}</span>);
          })
        }
      </div>
    );
  }
}
