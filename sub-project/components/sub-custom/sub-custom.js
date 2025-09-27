Component({
  properties: {
    counter: {
      type: Number,
      value: 0,
      observer: function(newVal) {
        this.updateDisplay(newVal);
      }
    }
  },

  data: {
    displayText: '',
    isEven: false
  },

  lifetimes: {
    attached() {
      this.updateDisplay(this.properties.counter);
    }
  },

  methods: {
    updateDisplay(count) {
      const isEven = count % 2 === 0;
      this.setData({
        displayText: `当前计数: ${count}`,
        isEven: isEven
      });
    },

    onTap() {
      this.triggerEvent('customtap', {
        counter: this.properties.counter,
        timestamp: Date.now()
      });
    }
  }
});