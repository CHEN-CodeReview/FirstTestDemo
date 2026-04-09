#define NULL 0
#define MYSQL_FILESORT_START(arg0, arg1)

class Item_subselect {};

class QEP_TAB {
 public:
  Item_subselect *join() { return new Item_subselect(); }
  bool quick() {
    this->a = 1;
    return true;
  }

  int a;
};

class Filesort {
 public:
  QEP_TAB *const tab;
};

bool filesort(Filesort *filesort, const char *ch01, const char *ch02) {
  QEP_TAB *const tab = filesort->tab;

  Item_subselect *const subselect = tab && tab->join() ? tab->join() : 0;

  MYSQL_FILESORT_START(const_cast<char *>(ch01), const_cast<char *>(ch02));

  if (tab->quick()) {
    // ...
  }
  
  return true;
}
