import DrawBoard from './components/DrawBoard';

function App() {

  return (
    <div className='flex justify-center p-5 lg:p-10'>
      <div className='text-gray-700 space-y-10 max-w-2xl w-full'>
        <div className='space-y-2'>
          <h3 className='text-3xl'>晴天烏龜</h3>
          <h4 className='text-gray-400'>抓取下方圖案移動到畫布上佈置你的烏龜圖</h4>
        </div>
        <DrawBoard />
      </div>
    </div>
  )
}

export default App
