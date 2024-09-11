import DrawBoard from './components/DrawBoard';

function App() {

  return (
    <div className='flex justify-center p-10'>
      <div className='text-gray-700 space-y-10 '>
        <div>
          <h3 className='text-3xl'>晴天烏龜</h3>
          <h4 className='text-gray-400'> 可切換以下顏色畫出你的烏龜</h4>
        </div>
        <DrawBoard />
      </div>
    </div>
  )
}

export default App
