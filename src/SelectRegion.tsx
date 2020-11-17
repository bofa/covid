import * as React from 'react';
import { Button, MenuItem } from '@blueprintjs/core';
import { ItemRenderer, MultiSelect } from '@blueprintjs/select';
import { smooth } from './Chart';

export interface ChartItem {
  label: string;
  data: any[];
}

export const REFERENCE_RANGE = 'referenceRange';
export const TREND_LINE = 'trendLine';
export const ANNOTATIONS = 'annotations';

const SelectInstance = MultiSelect.ofType<ChartItem>();

interface Props {
  items: ChartItem[];
  selectedItems: string[];
  smooth: string;
  onSelection: (selectedItems: string[]) => void;
}

export default class SelectChartItems extends React.Component<Props> {

  shouldComponentUpdate(nextProps: Props) {
    const update = this.props.items.length !== nextProps.items.length
      || this.props.smooth !== nextProps.smooth
      || this.props.selectedItems !== nextProps.selectedItems
      ;

    return update;
  }

  public render() {
    const { selectedItems } = this.props;

    const clearButton = selectedItems.length > 0
      ? <Button icon="cross" minimal={true} onClick={this.handleClear} />
      : <Button icon="double-caret-vertical" minimal={true} />;

    const sortedItems = this.props.items
      .map(s => {
        const data = smooth(s.data, +this.props.smooth);
        
        return {
          label: s.label,
          data,
          total: data[data.length - 1].y,
        };
      })
      .sort((v1, v2) => v2.total - v1.total);

    return (
      <SelectInstance
        onItemSelect={this.handleSelect}
        // initialContent={initialContent}
        itemRenderer={this.renderItem}
        // itemsEqual={areFilmsEqual}
        items={sortedItems}
        noResults={<MenuItem disabled={true} text="No results." />}
        tagRenderer={(item) => item.label}
        tagInputProps={{
        onRemove: (node, i) => this.deselect(node?.valueOf() as string),
        rightElement: clearButton,
        placeholder: 'Overlays',
        tagProps: { minimal: true }
        }}
        selectedItems={this.props.items.filter(ci => selectedItems.includes(ci.label))}
        resetOnQuery={false}
        itemPredicate={(query, item) => this.isSelected(item) ||
        item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())}
      />
    );
  }

  private renderItem: ItemRenderer<any> = (item, { modifiers, handleClick }) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    
    return (
    <MenuItem
        active={modifiers.active}
        icon={this.isSelected(item) ? 'tick' : 'blank'}
        key={item.label}
        // label={film.year.toString()}
        onClick={handleClick}
        text={item.label}
        label={'' + Math.round(item.total)}
        shouldDismissPopover={false}
    />
    );
  }

  private getSelectedIndex(item: ChartItem) {
    return this.props.selectedItems.findIndex(si => si === item.label);
  }

  private isSelected(item: ChartItem) {
    return this.getSelectedIndex(item) !== -1;
  }

  private select(item: ChartItem) {
    // window.gtag('send', 'event', 'Select', item.label);
    gtag('event', item.label, {
      'event_category': 'Country',
      'event_label': item.label,
      'value': 1,
    });

    const selectedAnalyses = [...this.props.selectedItems, item.label];

    this.props.onSelection(selectedAnalyses);
  }

//   private deselectIndex(index: number) {
//     const { selectedItems } = this.props;

//     this.props.onSelection(selectedItems.filter((l, i) => index !== i));
//   }

  private deselect(label: string) {
    const { selectedItems } = this.props;

    this.props.onSelection(selectedItems.filter((l, i) => l !== label));
  }

  private handleSelect = (item: ChartItem) => {
    if (!this.isSelected(item)) {
      this.select(item);
    } else {
      this.deselect(item.label);
    }
  }

  private handleClear = () => this.props.onSelection([]);
}
