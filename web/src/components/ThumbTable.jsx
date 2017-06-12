import React from 'react';
import { Link } from 'react-router-dom';
import dateformat from 'dateformat';

class MonthContainer extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    const { images, className, monthLabel, showLabel } = this.props;

    return (
      <div className="flex-column month-thumb-table">
        <h6>{monthLabel}</h6>
        <div className={'flex-container flex-wrap thumb-table ' + (className || '')}>
          {
            images.map((image) => {
              const label = showLabel ? (<span className="footnote">{image.base}</span>) : '';
              return (
                <Link key={'thumbtable-cell-' + image.id} to={'/images' + image.path} className="flex-column thumb-cell">
                  <img src={'/thumbs' + image.root + '/' + image.base + '_60x80_t.jpg'}/>
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
    const { images, className, showLabel } = this.props;
    const byMonth = this.sortByMonth(images);
    var monthKeys = Object.keys(byMonth);
    monthKeys.sort().reverse();
    return (
      <div className={'flex-column ' + (className || '')}>
        {
          monthKeys.map((key) => {
            const month = byMonth[key];
            return (<MonthContainer monthLabel={month['label']} images={month['images']}
                      key={'month-thumb-container-' + key} showLabel={showLabel}/>);
            return (<span key={'month-thumb-container-' + key}>{key}</span>);
          })
        }
      </div>
    );
  }
}
